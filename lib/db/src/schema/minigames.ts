import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const minigamesTable = pgTable("minigames", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  baseReward: integer("base_reward").notNull().default(50),
  difficulty: integer("difficulty").notNull().default(1),
  emoji: text("emoji").notNull().default("🎮"),
  config: text("config").notNull().default("{}"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMinigameSchema = createInsertSchema(minigamesTable).omit({ id: true, createdAt: true });
export type InsertMinigame = z.infer<typeof insertMinigameSchema>;
export type Minigame = typeof minigamesTable.$inferSelect;
