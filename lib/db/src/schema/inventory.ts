import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inventoryTable = pgTable("inventory", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  itemName: text("item_name").notNull(),
  emoji: text("emoji").notNull().default("📦"),
  description: text("description").notNull(),
  rarity: text("rarity").notNull().default("common"),
  effect: text("effect").notNull().default("none"),
  quantity: integer("quantity").notNull().default(1),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventoryTable).omit({ id: true, acquiredAt: true });
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventoryTable.$inferSelect;
