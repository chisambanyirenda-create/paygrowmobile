import { Router } from "express";
import { db } from "@workspace/db";
import { expensesTable, insertExpenseSchema } from "@workspace/db";
import { eq, gte, lte, and, desc } from "drizzle-orm";

const router = Router();

// List expenses
router.get("/", async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query as Record<string, string>;
    const conditions: ReturnType<typeof eq>[] = [];

    if (startDate) conditions.push(gte(expensesTable.date, startDate) as unknown as ReturnType<typeof eq>);
    if (endDate) conditions.push(lte(expensesTable.date, endDate) as unknown as ReturnType<typeof eq>);
    if (category) conditions.push(eq(expensesTable.category, category));

    const expenses = await db
      .select()
      .from(expensesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(expensesTable.date));

    res.json(expenses.map((e) => ({ ...e, amount: Number(e.amount) })));
  } catch (err) {
    req.log.error({ err }, "Error listing expenses");
    res.status(500).json({ error: "Failed to list expenses" });
  }
});

// Create expense
router.post("/", async (req, res) => {
  try {
    const parsed = insertExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [expense] = await db
      .insert(expensesTable)
      .values({ ...parsed.data, amount: String(parsed.data.amount) })
      .returning();
    res.status(201).json({ ...expense, amount: Number(expense.amount) });
  } catch (err) {
    req.log.error({ err }, "Error creating expense");
    res.status(500).json({ error: "Failed to create expense" });
  }
});

// Update expense
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: Record<string, unknown> = { ...req.body, updatedAt: new Date() };
    if (updates.amount !== undefined) updates.amount = String(updates.amount);

    const [expense] = await db
      .update(expensesTable)
      .set(updates)
      .where(eq(expensesTable.id, id))
      .returning();
    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }
    res.json({ ...expense, amount: Number(expense.amount) });
  } catch (err) {
    req.log.error({ err }, "Error updating expense");
    res.status(500).json({ error: "Failed to update expense" });
  }
});

// Delete expense
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(expensesTable).where(eq(expensesTable.id, id));
    res.json({ success: true, id });
  } catch (err) {
    req.log.error({ err }, "Error deleting expense");
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;
