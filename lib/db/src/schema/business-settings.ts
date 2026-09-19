import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

export const businessSettingsTable = pgTable("business_settings", {
  id: serial("id").primaryKey(),
  setupCompleted: boolean("setup_completed").notNull().default(false),
  openingCash: numeric("opening_cash", { precision: 12, scale: 2 }).notNull().default("0"),
  currentPhoneCount: integer("current_phone_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BusinessSettings = typeof businessSettingsTable.$inferSelect;