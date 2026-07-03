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
import { customersTable } from "./customers";
import { productsTable } from "./products";

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customersTable.id, {
    onDelete: "set null",
  }),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  discount: numeric("discount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  totalCost: numeric("total_cost", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  profit: numeric("profit", { precision: 12, scale: 2 }).notNull().default("0"),
  paymentMethod: text("payment_method").notNull().default("cash"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const saleItemsTable = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id")
    .notNull()
    .references(() => salesTable.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  lineProfit: numeric("line_profit", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
});

export const insertSaleSchema = createInsertSchema(salesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItemsTable).omit({
  id: true,
});

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type Sale = typeof salesTable.$inferSelect;
export type SaleItem = typeof saleItemsTable.$inferSelect;
