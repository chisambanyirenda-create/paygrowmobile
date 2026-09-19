import { Router } from "express";
import { db } from "@workspace/db";
import {
  businessSettingsTable,
  customersTable,
  expensesTable,
  productsTable,
  saleItemsTable,
  salesTable,
  suppliersTable,
  withdrawalsTable,
} from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router = Router();

router.get("/settings", async (_req, res) => {
  try {
    const [settings] = await db.select().from(businessSettingsTable).orderBy(desc(businessSettingsTable.id)).limit(1);
    res.json({
      setupCompleted: settings?.setupCompleted ?? false,
      openingCash: Number(settings?.openingCash ?? 0),
      currentPhoneCount: settings?.currentPhoneCount ?? 0,
    });
  } catch (err) {
    console.error("Failed to load business settings", err);
    res.status(500).json({ error: "Failed to load business settings" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const openingCash = Number(req.body?.openingCash);
    const currentPhoneCount = Number(req.body?.currentPhoneCount);
    if (!Number.isFinite(openingCash) || openingCash < 0 || !Number.isInteger(currentPhoneCount) || currentPhoneCount < 0) {
      res.status(400).json({ error: "Enter valid non-negative cash and phone count values" });
      return;
    }
    const [existing] = await db.select({ id: businessSettingsTable.id }).from(businessSettingsTable).limit(1);
    const values = {
      setupCompleted: true,
      openingCash: String(openingCash),
      currentPhoneCount,
      updatedAt: new Date(),
    };
    const [settings] = existing
      ? await db.update(businessSettingsTable).set(values).where(eq(businessSettingsTable.id, existing.id)).returning()
      : await db.insert(businessSettingsTable).values(values).returning();
    res.json({
      setupCompleted: settings.setupCompleted,
      openingCash: Number(settings.openingCash),
      currentPhoneCount: settings.currentPhoneCount,
    });
  } catch (err) {
    console.error("Failed to save business settings", err);
    res.status(500).json({ error: "Failed to save business settings" });
  }
});

router.post("/reset", async (req, res) => {
  if (req.body?.confirm !== true) {
    res.status(400).json({ error: "Explicit confirmation is required before resetting business data" });
    return;
  }
  try {
    await db.transaction(async (tx) => {
      await tx.delete(saleItemsTable);
      await tx.delete(salesTable);
      await tx.delete(withdrawalsTable);
      await tx.delete(expensesTable);
      await tx.delete(productsTable);
      await tx.delete(customersTable);
      await tx.delete(suppliersTable);
      await tx.delete(businessSettingsTable);
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to reset business data", err);
    res.status(500).json({ error: "Failed to reset business data" });
  }
});

export default router;