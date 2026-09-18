import { Router } from "express";
import { db } from "@workspace/db";
import {
  expensesTable,
  productsTable,
  saleItemsTable,
  salesTable,
  withdrawalsTable,
} from "@workspace/db";
import { desc, sql, eq } from "drizzle-orm";

const router = Router();

const asNumber = (value: unknown) => Number(value ?? 0);
const spendingCategories = new Set([
  "new_phone_stock",
  "shipping",
  "repairs",
  "accessories",
  "advertising",
  "transport",
  "business_equipment",
  "personal",
  "other",
]);

async function getMoneySummary() {
  const [inventory] = await db.select({
    stockCost: sql<number>`COALESCE(SUM(${productsTable.costPrice} * ${productsTable.stockQuantity}), 0)::numeric`,
    stockValue: sql<number>`COALESCE(SUM(${productsTable.sellingPrice} * ${productsTable.stockQuantity}), 0)::numeric`,
    phonesInStock: sql<number>`COALESCE(SUM(${productsTable.stockQuantity}), 0)::int`,
  }).from(productsTable);

  const [sales] = await db.select({
    revenue: sql<number>`COALESCE(SUM(${salesTable.totalAmount}), 0)::numeric`,
    cogs: sql<number>`COALESCE(SUM(${salesTable.totalCost}), 0)::numeric`,
    grossProfit: sql<number>`COALESCE(SUM(${salesTable.profit}), 0)::numeric`,
  }).from(salesTable);

  const [sold] = await db.select({
    phonesSold: sql<number>`COALESCE(SUM(${saleItemsTable.quantity}), 0)::int`,
  }).from(saleItemsTable);

  const [expenses] = await db.select({
    total: sql<number>`COALESCE(SUM(${expensesTable.amount}), 0)::numeric`,
  }).from(expensesTable);

  const [withdrawals] = await db.select({
    total: sql<number>`COALESCE(SUM(${withdrawalsTable.amount}), 0)::numeric`,
  }).from(withdrawalsTable);

  const stockCost = asNumber(inventory.stockCost);
  const stockValue = asNumber(inventory.stockValue);
  const revenue = asNumber(sales.revenue);
  const cogs = asNumber(sales.cogs);
  const operatingExpenses = asNumber(expenses.total);
  const personalWithdrawals = asNumber(withdrawals.total);
  const cashAvailable = revenue - cogs - operatingExpenses - personalWithdrawals;

  return {
    businessCapital: stockCost + cashAvailable,
    requiredReplacementCapital: stockCost,
    stockCost,
    stockValue,
    potentialProfit: stockValue - stockCost,
    cashAvailable,
    totalRevenue: revenue,
    totalCogs: cogs,
    realizedGrossProfit: asNumber(sales.grossProfit),
    operatingExpenses,
    personalWithdrawals,
    phonesInStock: inventory.phonesInStock,
    phonesSold: sold.phonesSold,
  };
}

router.get("/summary", async (_req, res) => {
  try {
    res.json(await getMoneySummary());
  } catch (err) {
    console.error("Failed to build money summary", err);
    res.status(500).json({ error: "Failed to build money summary" });
  }
});

router.get("/withdrawals", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(withdrawalsTable)
      .orderBy(desc(withdrawalsTable.date), desc(withdrawalsTable.createdAt));
    res.json(rows.map((row) => ({ ...row, amount: asNumber(row.amount) })));
  } catch (err) {
    console.error("Failed to list withdrawals", err);
    res.status(500).json({ error: "Failed to list withdrawals" });
  }
});

router.post("/withdrawals", async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    const reason = String(req.body?.reason ?? "").trim();
    const date = String(req.body?.date ?? new Date().toISOString().slice(0, 10));
    const category = String(req.body?.category ?? "personal");
    const confirmed = req.body?.confirm === true;

    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: "Withdrawal amount must be greater than zero" });
      return;
    }
    if (!reason) {
      res.status(400).json({ error: "A withdrawal reason is required" });
      return;
    }
    if (!spendingCategories.has(category)) {
      res.status(400).json({ error: "Choose a valid spending category" });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: "Date must use YYYY-MM-DD format" });
      return;
    }

    const summary = await getMoneySummary();
    const nextCash = summary.cashAvailable - amount;
    const warning = nextCash < summary.requiredReplacementCapital;

    if (warning && !confirmed) {
      res.status(409).json({
        error: "This withdrawal would reduce cash below required replacement capital",
        warning: true,
        cashAvailableAfter: nextCash,
        requiredReplacementCapital: summary.requiredReplacementCapital,
      });
      return;
    }

    const [created] = await db.insert(withdrawalsTable).values({
      amount: amount.toFixed(2),
      reason,
      date,
      category,
    }).returning();

    res.status(201).json({
      withdrawal: { ...created, amount: asNumber(created.amount) },
      warning,
      cashAvailableAfter: nextCash,
      requiredReplacementCapital: summary.requiredReplacementCapital,
    });
  } catch (err) {
    console.error("Failed to create withdrawal", err);
    res.status(500).json({ error: "Failed to create withdrawal" });
  }
});

router.delete("/withdrawals/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db.delete(withdrawalsTable)
      .where(eq(withdrawalsTable.id, id))
      .returning({ id: withdrawalsTable.id });
    if (!deleted.length) {
      res.status(404).json({ error: "Withdrawal not found" });
      return;
    }
    res.json({ success: true, id });
  } catch (err) {
    console.error("Failed to delete withdrawal", err);
    res.status(500).json({ error: "Failed to delete withdrawal" });
  }
});

export default router;