import { Router } from "express";
import { db } from "@workspace/db";
import { suppliersTable, insertSupplierSchema } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// List suppliers
router.get("/", async (req, res) => {
  try {
    const suppliers = await db
      .select()
      .from(suppliersTable)
      .orderBy(desc(suppliersTable.createdAt));
    res.json(suppliers);
  } catch (err) {
    req.log.error({ err }, "Error listing suppliers");
    res.status(500).json({ error: "Failed to list suppliers" });
  }
});

// Create supplier
router.post("/", async (req, res) => {
  try {
    const parsed = insertSupplierSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [supplier] = await db
      .insert(suppliersTable)
      .values(parsed.data)
      .returning();
    res.status(201).json(supplier);
  } catch (err) {
    req.log.error({ err }, "Error creating supplier");
    res.status(500).json({ error: "Failed to create supplier" });
  }
});

// Update supplier
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [supplier] = await db
      .update(suppliersTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(suppliersTable.id, id))
      .returning();
    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }
    res.json(supplier);
  } catch (err) {
    req.log.error({ err }, "Error updating supplier");
    res.status(500).json({ error: "Failed to update supplier" });
  }
});

// Delete supplier
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(suppliersTable).where(eq(suppliersTable.id, id));
    res.json({ success: true, id });
  } catch (err) {
    req.log.error({ err }, "Error deleting supplier");
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

export default router;
