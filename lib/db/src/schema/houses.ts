import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const housesTable = pgTable("houses", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().unique(),
  hexQ: integer("hex_q").notNull().default(3),
  hexR: integer("hex_r").notNull().default(3),
  name: text("name").notNull().default("Mi Casita"),
  style: text("style").notNull().default("beach"),
  color: text("color").notNull().default("#FF6B6B"),
  decoration: text("decoration").notNull().default("flamingo"),
  visitCount: integer("visit_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHouseSchema = createInsertSchema(housesTable).omit({ id: true, createdAt: true });
export type InsertHouse = z.infer<typeof insertHouseSchema>;
export type House = typeof housesTable.$inferSelect;
