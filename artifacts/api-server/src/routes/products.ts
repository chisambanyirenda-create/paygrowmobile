import { Router } from "express";
import { db } from "@workspace/db";
import {
  productsTable,
  suppliersTable,
  insertProductSchema,
} from "@workspace/db";
import { eq, ilike, and, lte, or, sql } from "drizzle-orm";

const router = Router();

// List products
router.get("/", async (req, res) => {
  try {
    const { category, search, lowStock } = req.query as Record<string, string>;

    const conditions: ReturnType<typeof eq>[] = [];

    if (category) {
      conditions.push(eq(productsTable.category, category));
    }
    if (search) {
      conditions.push(
        or(
          ilike(productsTable.name, `%${search}%`),
          ilike(productsTable.brand, `%${search}%`),
          ilike(productsTable.model, `%${search}%`),
          ilike(productsTable.sku, `%${search}%`)
        ) as ReturnType<typeof eq>
      );
    }
    if (lowStock === "true") {
      conditions.push(
        sql`${productsTable.stockQuantity} <= ${productsTable.lowStockThreshold}` as unknown as ReturnType<typeof eq>
      );
    }

    const products = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        sku: productsTable.sku,
        category: productsTable.category,
        brand: productsTable.brand,
        model: productsTable.model,
        costPrice: productsTable.costPrice,
        sellingPrice: productsTable.sellingPrice,
        stockQuantity: productsTable.stockQuantity,
        lowStockThreshold: productsTable.lowStockThreshold,
        description: productsTable.description,
        supplierId: productsTable.supplierId,
        supplierName: suppliersTable.name,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
      })
      .from(productsTable)
      .leftJoin(suppliersTable, eq(productsTable.supplierId, suppliersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json(
      products.map((p) => ({
        ...p,
        costPrice: Number(p.costPrice),
        sellingPrice: Number(p.sellingPrice),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Error listing products");
    res.status(500).json({ error: "Failed to list products" });
  }
});

// Get low stock
router.get("/low-stock", async (req, res) => {
  try {
    const products = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        sku: productsTable.sku,
        category: productsTable.category,
        brand: productsTable.brand,
        model: productsTable.model,
        costPrice: productsTable.costPrice,
        sellingPrice: productsTable.sellingPrice,
        stockQuantity: productsTable.stockQuantity,
        lowStockThreshold: productsTable.lowStockThreshold,
        description: productsTable.description,
        supplierId: productsTable.supplierId,
        supplierName: suppliersTable.name,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
      })
      .from(productsTable)
      .leftJoin(suppliersTable, eq(productsTable.supplierId, suppliersTable.id))
      .where(
        sql`${productsTable.stockQuantity} <= ${productsTable.lowStockThreshold}`
      );

    res.json(
      products.map((p) => ({
        ...p,
        costPrice: Number(p.costPrice),
        sellingPrice: Number(p.sellingPrice),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Error getting low stock");
    res.status(500).json({ error: "Failed to get low stock products" });
  }
});

// Get single product
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        sku: productsTable.sku,
        category: productsTable.category,
        brand: productsTable.brand,
        model: productsTable.model,
        costPrice: productsTable.costPrice,
        sellingPrice: productsTable.sellingPrice,
        stockQuantity: productsTable.stockQuantity,
        lowStockThreshold: productsTable.lowStockThreshold,
        description: productsTable.description,
        supplierId: productsTable.supplierId,
        supplierName: suppliersTable.name,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
      })
      .from(productsTable)
      .leftJoin(suppliersTable, eq(productsTable.supplierId, suppliersTable.id))
      .where(eq(productsTable.id, id));

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({
      ...product,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting product");
    res.status(500).json({ error: "Failed to get product" });
  }
});

// Create product
router.post("/", async (req, res) => {
  try {
    const parsed = insertProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [product] = await db
      .insert(productsTable)
      .values({
        ...parsed.data,
        costPrice: String(parsed.data.costPrice ?? 0),
        sellingPrice: String(parsed.data.sellingPrice ?? 0),
      })
      .returning();

    res.status(201).json({
      ...product,
      supplierName: null,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating product");
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update product
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: Record<string, unknown> = { ...req.body, updatedAt: new Date() };
    if (updates.costPrice !== undefined)
      updates.costPrice = String(updates.costPrice);
    if (updates.sellingPrice !== undefined)
      updates.sellingPrice = String(updates.sellingPrice);

    const [product] = await db
      .update(productsTable)
      .set(updates)
      .where(eq(productsTable.id, id))
      .returning();

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({
      ...product,
      supplierName: null,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
    });
  } catch (err) {
    req.log.error({ err }, "Error updating product");
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete product
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ success: true, id });
  } catch (err) {
    req.log.error({ err }, "Error deleting product");
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
