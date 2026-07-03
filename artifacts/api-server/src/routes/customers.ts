import { Router } from "express";
import { db } from "@workspace/db";
import { customersTable, salesTable, insertCustomerSchema } from "@workspace/db";
import { eq, ilike, sql, desc } from "drizzle-orm";

const router = Router();

// List customers
router.get("/", async (req, res) => {
  try {
    const { search } = req.query as Record<string, string>;

    const customers = await db
      .select({
        id: customersTable.id,
        name: customersTable.name,
        phone: customersTable.phone,
        email: customersTable.email,
        address: customersTable.address,
        createdAt: customersTable.createdAt,
        totalPurchases: sql<number>`COUNT(${salesTable.id})::int`,
        totalSpent: sql<number>`COALESCE(SUM(${salesTable.totalAmount}), 0)::numeric`,
      })
      .from(customersTable)
      .leftJoin(salesTable, eq(salesTable.customerId, customersTable.id))
      .where(search ? ilike(customersTable.name, `%${search}%`) : undefined)
      .groupBy(customersTable.id)
      .orderBy(desc(customersTable.createdAt));

    res.json(
      customers.map((c) => ({ ...c, totalSpent: Number(c.totalSpent) }))
    );
  } catch (err) {
    req.log.error({ err }, "Error listing customers");
    res.status(500).json({ error: "Failed to list customers" });
  }
});

// Get single customer
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [customer] = await db
      .select({
        id: customersTable.id,
        name: customersTable.name,
        phone: customersTable.phone,
        email: customersTable.email,
        address: customersTable.address,
        createdAt: customersTable.createdAt,
        totalPurchases: sql<number>`COUNT(${salesTable.id})::int`,
        totalSpent: sql<number>`COALESCE(SUM(${salesTable.totalAmount}), 0)::numeric`,
      })
      .from(customersTable)
      .leftJoin(salesTable, eq(salesTable.customerId, customersTable.id))
      .where(eq(customersTable.id, id))
      .groupBy(customersTable.id);

    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.json({ ...customer, totalSpent: Number(customer.totalSpent) });
  } catch (err) {
    req.log.error({ err }, "Error getting customer");
    res.status(500).json({ error: "Failed to get customer" });
  }
});

// Create customer
router.post("/", async (req, res) => {
  try {
    const parsed = insertCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [customer] = await db
      .insert(customersTable)
      .values(parsed.data)
      .returning();
    res.status(201).json({ ...customer, totalPurchases: 0, totalSpent: 0 });
  } catch (err) {
    req.log.error({ err }, "Error creating customer");
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// Update customer
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [customer] = await db
      .update(customersTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(customersTable.id, id))
      .returning();
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.json({ ...customer, totalPurchases: 0, totalSpent: 0 });
  } catch (err) {
    req.log.error({ err }, "Error updating customer");
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// Delete customer
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(customersTable).where(eq(customersTable.id, id));
    res.json({ success: true, id });
  } catch (err) {
    req.log.error({ err }, "Error deleting customer");
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

export default router;
