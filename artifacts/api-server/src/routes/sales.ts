import { Router } from "express";
import { db, pool } from "@workspace/db";
import {
  salesTable,
  saleItemsTable,
  productsTable,
  customersTable,
} from "@workspace/db";
import { eq, gte, lte, and, desc, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@workspace/db";

const router = Router();

async function formatSale(sale: typeof salesTable.$inferSelect) {
  const items = await db
    .select({
      id: saleItemsTable.id,
      productId: saleItemsTable.productId,
      productName: productsTable.name,
      quantity: saleItemsTable.quantity,
      unitPrice: saleItemsTable.unitPrice,
      unitCost: saleItemsTable.unitCost,
      lineTotal: saleItemsTable.lineTotal,
      lineProfit: saleItemsTable.lineProfit,
    })
    .from(saleItemsTable)
    .leftJoin(productsTable, eq(saleItemsTable.productId, productsTable.id))
    .where(eq(saleItemsTable.saleId, sale.id));

  let customerName: string | null = null;
  if (sale.customerId) {
    const [customer] = await db
      .select({ name: customersTable.name })
      .from(customersTable)
      .where(eq(customersTable.id, sale.customerId));
    customerName = customer?.name ?? null;
  }

  return {
    id: sale.id,
    customerId: sale.customerId,
    customerName,
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName ?? "Unknown",
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      unitCost: Number(i.unitCost),
      lineTotal: Number(i.lineTotal),
      lineProfit: Number(i.lineProfit),
    })),
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    totalAmount: Number(sale.totalAmount),
    totalCost: Number(sale.totalCost),
    profit: Number(sale.profit),
    paymentMethod: sale.paymentMethod,
    notes: sale.notes,
    createdAt: sale.createdAt,
  };
}

// List sales
router.get("/", async (req, res) => {
  try {
    const { startDate, endDate, customerId } = req.query as Record<string, string>;
    const conditions: ReturnType<typeof eq>[] = [];

    if (startDate)
      conditions.push(
        gte(salesTable.createdAt, new Date(startDate)) as unknown as ReturnType<typeof eq>
      );
    if (endDate)
      conditions.push(
        lte(salesTable.createdAt, new Date(endDate + "T23:59:59")) as unknown as ReturnType<typeof eq>
      );
    if (customerId)
      conditions.push(eq(salesTable.customerId, parseInt(customerId)));

    const sales = await db
      .select()
      .from(salesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(salesTable.createdAt));

    const formatted = await Promise.all(sales.map(formatSale));
    res.json(formatted);
  } catch (err) {
    req.log.error({ err }, "Error listing sales");
    res.status(500).json({ error: "Failed to list sales" });
  }
});

// Get single sale
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [sale] = await db
      .select()
      .from(salesTable)
      .where(eq(salesTable.id, id));
    if (!sale) {
      res.status(404).json({ error: "Sale not found" });
      return;
    }
    res.json(await formatSale(sale));
  } catch (err) {
    req.log.error({ err }, "Error getting sale");
    res.status(500).json({ error: "Failed to get sale" });
  }
});

// Create sale — fully transactional with stock availability check
router.post("/", async (req, res) => {
  try {
    const { customerId, items, discount = 0, paymentMethod, notes } = req.body as {
      customerId?: number;
      items: Array<{ productId: number; quantity: number; unitPrice: number }>;
      discount?: number;
      paymentMethod: string;
      notes?: string;
    };

    if (!items || items.length === 0) {
      res.status(400).json({ error: "At least one item is required" });
      return;
    }

    // Validate item structure
    for (const item of items) {
      if (
        typeof item.productId !== "number" ||
        typeof item.quantity !== "number" ||
        item.quantity < 1 ||
        typeof item.unitPrice !== "number" ||
        item.unitPrice < 0
      ) {
        res.status(400).json({ error: "Invalid item data" });
        return;
      }
    }

    const productIds = items.map((i) => i.productId);

    // Acquire a dedicated client for the transaction
    const client = await pool.connect();
    const txDb = drizzle(client, { schema });
    let newSale: typeof salesTable.$inferSelect;
    try {
      await client.query("BEGIN");

      // Fetch and lock products inside transaction
      const products = await txDb
        .select()
        .from(productsTable)
        .where(inArray(productsTable.id, productIds))
        .for("update");

      const productMap = new Map(products.map((p) => [p.id, p]));

      // Validate all products exist and have sufficient stock
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          await client.query("ROLLBACK");
          res.status(400).json({ error: `Product ${item.productId} not found` });
          return;
        }
        if (product.stockQuantity < item.quantity) {
          await client.query("ROLLBACK");
          res.status(400).json({
            error: `Insufficient stock for "${product.name}": available ${product.stockQuantity}, requested ${item.quantity}`,
          });
          return;
        }
      }

      let subtotal = 0;
      let totalCost = 0;
      const saleItemsData: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
        unitCost: number;
        lineTotal: number;
        lineProfit: number;
      }> = [];

      for (const item of items) {
        const product = productMap.get(item.productId)!;
        const unitCost = Number(product.costPrice);
        const lineTotal = item.unitPrice * item.quantity;
        const lineCost = unitCost * item.quantity;
        subtotal += lineTotal;
        totalCost += lineCost;
        saleItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost,
          lineTotal,
          lineProfit: lineTotal - lineCost,
        });
      }

      const totalAmount = subtotal - Number(discount);
      const profit = totalAmount - totalCost;

      // Insert sale
      const [sale] = await txDb
        .insert(salesTable)
        .values({
          customerId: customerId ?? null,
          subtotal: String(subtotal),
          discount: String(discount),
          totalAmount: String(totalAmount),
          totalCost: String(totalCost),
          profit: String(profit),
          paymentMethod,
          notes: notes ?? null,
        })
        .returning();

      // Insert sale items
      await txDb.insert(saleItemsTable).values(
        saleItemsData.map((item) => ({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          unitCost: String(item.unitCost),
          lineTotal: String(item.lineTotal),
          lineProfit: String(item.lineProfit),
        }))
      );

      // Decrement stock
      for (const item of saleItemsData) {
        await txDb
          .update(productsTable)
          .set({
            stockQuantity: sql`${productsTable.stockQuantity} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(productsTable.id, item.productId));
      }

      await client.query("COMMIT");
      newSale = sale;
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    res.status(201).json(await formatSale(newSale));
  } catch (err) {
    req.log.error({ err }, "Error creating sale");
    res.status(500).json({ error: "Failed to create sale" });
  }
});

// Delete (void) sale — restore stock in transaction
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const client = await pool.connect();
    const txDb = drizzle(client, { schema });
    try {
      await client.query("BEGIN");

      const items = await txDb
        .select()
        .from(saleItemsTable)
        .where(eq(saleItemsTable.saleId, id));

      if (items.length === 0) {
        // Check sale exists
        const [sale] = await txDb
          .select({ id: salesTable.id })
          .from(salesTable)
          .where(eq(salesTable.id, id));
        if (!sale) {
          await client.query("ROLLBACK");
          res.status(404).json({ error: "Sale not found" });
          return;
        }
      }

      // Restore stock
      for (const item of items) {
        await txDb
          .update(productsTable)
          .set({
            stockQuantity: sql`${productsTable.stockQuantity} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(productsTable.id, item.productId));
      }

      await txDb.delete(salesTable).where(eq(salesTable.id, id));
      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    res.json({ success: true, id });
  } catch (err) {
    req.log.error({ err }, "Error deleting sale");
    res.status(500).json({ error: "Failed to delete sale" });
  }
});

export default router;
