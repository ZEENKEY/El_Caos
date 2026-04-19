import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const locationsTable = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  hexQ: integer("hex_q").notNull(),
  hexR: integer("hex_r").notNull(),
  emoji: text("emoji").notNull(),
  description: text("description").notNull(),
  riskLevel: integer("risk_level").notNull().default(1),
  energyRestore: integer("energy_restore").notNull().default(0),
  minigameId: integer("minigame_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLocationSchema = createInsertSchema(locationsTable).omit({ id: true, createdAt: true });
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locationsTable.$inferSelect;
