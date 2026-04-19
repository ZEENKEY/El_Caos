import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gameLogsTable = pgTable("game_logs", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id"),
  action: text("action").notNull(),
  details: text("details").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGameLogSchema = createInsertSchema(gameLogsTable).omit({ id: true, createdAt: true });
export type InsertGameLog = z.infer<typeof insertGameLogSchema>;
export type GameLog = typeof gameLogsTable.$inferSelect;
