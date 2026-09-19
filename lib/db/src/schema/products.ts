import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { suppliersTable } from "./suppliers";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku"),
  category: text("category").notNull().default("other"),
  brand: text("brand"),
  model: text("model"),
  storage: text("storage"),
  color: text("color"),
  condition: text("condition"),
  imei: text("imei"),
  batteryHealth: text("battery_health"),
  costPrice: numeric("cost_price", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  acquisitionType: text("acquisition_type").notNull().default("purchased"),
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull().default("0"),
  shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  customsCost: numeric("customs_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  repairCost: numeric("repair_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  accessoriesCost: numeric("accessories_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  otherCost: numeric("other_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  tradeValue: numeric("trade_value", { precision: 12, scale: 2 }).notNull().default("0"),
  acquisitionNote: text("acquisition_note"),
  acquisitionDate: timestamp("acquisition_date"),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  description: text("description"),
  supplierId: integer("supplier_id").references(() => suppliersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
