import { pgTable, text, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const npcsTable = pgTable("npcs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  personality: text("personality").notNull(),
  dialogue: text("dialogue").notNull(),
  locationId: integer("location_id"),
  spawnProbability: real("spawn_probability").notNull().default(0.5),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNpcSchema = createInsertSchema(npcsTable).omit({ id: true, createdAt: true });
export type InsertNpc = z.infer<typeof insertNpcSchema>;
export type Npc = typeof npcsTable.$inferSelect;
