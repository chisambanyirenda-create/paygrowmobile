import { Router } from "express";
import { db } from "@workspace/db";
import {
  salesTable,
  saleItemsTable,
  productsTable,
  expensesTable,
  customersTable,
} from "@workspace/db";
import { eq, gte, sql, desc } from "drizzle-orm";

const router = Router();

function getPeriodStart(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "month": {
      const d = new Date(now);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "year": {
      const d = new Date(now.getFullYear(), 0, 1);
      return d;
    }
    default:
      return null;
  }
}

// Dashboard summary
router.get("/summary", async (req, res) => {
  try {
    const period = (req.query.period as string) || "month";
    const since = getPeriodStart(period);

    const salesWhere = since
      ? gte(salesTable.createdAt, since)
      : undefined;
    const expensesWhere = since
      ? gte(expensesTable.date, since.toISOString().split("T")[0])
      : undefined;

    const [salesAgg] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${salesTable.totalAmount}), 0)::numeric`,
        totalCost: sql<number>`COALESCE(SUM(${salesTable.totalCost}), 0)::numeric`,
        totalProfit: sql<number>`COALESCE(SUM(${salesTable.profit}), 0)::numeric`,
        totalSales: sql<number>`COUNT(*)::int`,
      })
      .from(salesTable)
      .where(salesWhere);

    const [itemsAgg] = await db
      .select({
        totalProductsSold: sql<number>`COALESCE(SUM(${saleItemsTable.quantity}), 0)::int`,
      })
      .from(saleItemsTable)
      .leftJoin(salesTable, eq(saleItemsTable.saleId, salesTable.id))
      .where(salesWhere);

    const [expensesAgg] = await db
      .select({
        totalExpenses: sql<number>`COALESCE(SUM(${expensesTable.amount}), 0)::numeric`,
      })
      .from(expensesTable)
      .where(expensesWhere);

    const [inventoryAgg] = await db
      .select({
        inventoryValue: sql<number>`COALESCE(SUM(${productsTable.costPrice} * ${productsTable.stockQuantity}), 0)::numeric`,
        totalProducts: sql<number>`COUNT(*)::int`,
        lowStockCount: sql<number>`COUNT(CASE WHEN ${productsTable.stockQuantity} <= ${productsTable.lowStockThreshold} THEN 1 END)::int`,
      })
      .from(productsTable);

    const [customerAgg] = await db
      .select({ totalCustomers: sql<number>`COUNT(*)::int` })
      .from(customersTable);

    const totalRevenue = Number(salesAgg.totalRevenue);
    const totalExpenses = Number(expensesAgg.totalExpenses);
    const netProfit = Number(salesAgg.totalProfit) - totalExpenses;

    res.json({
      totalRevenue,
      totalCost: Number(salesAgg.totalCost),
      totalProfit: Number(salesAgg.totalProfit),
      totalExpenses,
      netProfit,
      totalSales: salesAgg.totalSales,
      totalProductsSold: itemsAgg.totalProductsSold,
      inventoryValue: Number(inventoryAgg.inventoryValue),
      totalProducts: inventoryAgg.totalProducts,
      lowStockCount: inventoryAgg.lowStockCount,
      totalCustomers: customerAgg.totalCustomers,
      period,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting dashboard summary");
    res.status(500).json({ error: "Failed to get dashboard summary" });
  }
});

// Recent activity
router.get("/recent-activity", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || "10");

    const sales = await db
      .select()
      .from(salesTable)
      .orderBy(desc(salesTable.createdAt))
      .limit(limit);

    const expenses = await db
      .select()
      .from(expensesTable)
      .orderBy(desc(expensesTable.createdAt))
      .limit(limit);

    // Format sales with items
    const formattedSales = await Promise.all(
      sales.map(async (sale) => {
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

        return {
          id: sale.id,
          customerId: sale.customerId,
          customerName: null as string | null,
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
      })
    );

    res.json({
      sales: formattedSales,
      expenses: expenses.map((e) => ({ ...e, amount: Number(e.amount) })),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting recent activity");
    res.status(500).json({ error: "Failed to get recent activity" });
  }
});

// Sales by category
router.get("/sales-by-category", async (req, res) => {
  try {
    const period = (req.query.period as string) || "month";
    const since = getPeriodStart(period);

    const rows = await db
      .select({
        category: productsTable.category,
        revenue: sql<number>`COALESCE(SUM(${saleItemsTable.lineTotal}), 0)::numeric`,
        profit: sql<number>`COALESCE(SUM(${saleItemsTable.lineProfit}), 0)::numeric`,
        unitsSold: sql<number>`COALESCE(SUM(${saleItemsTable.quantity}), 0)::int`,
      })
      .from(saleItemsTable)
      .leftJoin(productsTable, eq(saleItemsTable.productId, productsTable.id))
      .leftJoin(salesTable, eq(saleItemsTable.saleId, salesTable.id))
      .where(since ? gte(salesTable.createdAt, since) : undefined)
      .groupBy(productsTable.category);

    res.json(
      rows.map((r) => ({
        category: r.category,
        revenue: Number(r.revenue),
        profit: Number(r.profit),
        unitsSold: r.unitsSold,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Error getting sales by category");
    res.status(500).json({ error: "Failed to get sales by category" });
  }
});

// Profit/loss over time
router.get("/profit-loss", async (req, res) => {
  try {
    const period = (req.query.period as string) || "month";

    let groupFormat: string;
    let since: Date;

    if (period === "week") {
      groupFormat = "YYYY-MM-DD";
      since = new Date();
      since.setDate(since.getDate() - 7);
    } else if (period === "month") {
      groupFormat = "YYYY-MM-DD";
      since = new Date();
      since.setDate(since.getDate() - 30);
    } else {
      groupFormat = "YYYY-MM";
      since = new Date();
      since.setFullYear(since.getFullYear() - 1);
    }

    const fmt = sql.raw(`'${groupFormat}'`);

    const salesRows = await db
      .select({
        label: sql<string>`TO_CHAR(${salesTable.createdAt}, ${fmt})`,
        revenue: sql<number>`COALESCE(SUM(${salesTable.totalAmount}), 0)::numeric`,
        profit: sql<number>`COALESCE(SUM(${salesTable.profit}), 0)::numeric`,
      })
      .from(salesTable)
      .where(gte(salesTable.createdAt, since))
      .groupBy(sql`TO_CHAR(${salesTable.createdAt}, ${fmt})`)
      .orderBy(sql`TO_CHAR(${salesTable.createdAt}, ${fmt})`);

    const expenseRows = await db
      .select({
        label: sql<string>`TO_CHAR(${expensesTable.date}::timestamp, ${fmt})`,
        expenses: sql<number>`COALESCE(SUM(${expensesTable.amount}), 0)::numeric`,
      })
      .from(expensesTable)
      .where(gte(expensesTable.date, since.toISOString().split("T")[0]))
      .groupBy(sql`TO_CHAR(${expensesTable.date}::timestamp, ${fmt})`)
      .orderBy(sql`TO_CHAR(${expensesTable.date}::timestamp, ${fmt})`);

    const expenseMap = new Map(
      expenseRows.map((e) => [e.label, Number(e.expenses)])
    );

    const result = salesRows.map((r) => ({
      label: r.label,
      revenue: Number(r.revenue),
      expenses: expenseMap.get(r.label) ?? 0,
      profit: Number(r.profit) - (expenseMap.get(r.label) ?? 0),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error getting profit/loss");
    res.status(500).json({ error: "Failed to get profit/loss" });
  }
});

// Top products
router.get("/top-products", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || "5");
    const period = (req.query.period as string) || "month";
    const since = getPeriodStart(period);

    const rows = await db
      .select({
        productId: saleItemsTable.productId,
        productName: productsTable.name,
        category: productsTable.category,
        unitsSold: sql<number>`COALESCE(SUM(${saleItemsTable.quantity}), 0)::int`,
        revenue: sql<number>`COALESCE(SUM(${saleItemsTable.lineTotal}), 0)::numeric`,
        profit: sql<number>`COALESCE(SUM(${saleItemsTable.lineProfit}), 0)::numeric`,
      })
      .from(saleItemsTable)
      .leftJoin(productsTable, eq(saleItemsTable.productId, productsTable.id))
      .leftJoin(salesTable, eq(saleItemsTable.saleId, salesTable.id))
      .where(since ? gte(salesTable.createdAt, since) : undefined)
      .groupBy(saleItemsTable.productId, productsTable.name, productsTable.category)
      .orderBy(desc(sql`SUM(${saleItemsTable.lineTotal})`))
      .limit(limit);

    res.json(
      rows.map((r) => ({
        productId: r.productId,
        productName: r.productName ?? "Unknown",
        category: r.category ?? "other",
        unitsSold: r.unitsSold,
        revenue: Number(r.revenue),
        profit: Number(r.profit),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Error getting top products");
    res.status(500).json({ error: "Failed to get top products" });
  }
});

export default router;
