import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const traitsTable = pgTable("traits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const playerTraitsTable = pgTable("player_traits", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  traitId: integer("trait_id").notNull(),
  level: integer("level").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTraitSchema = createInsertSchema(traitsTable).omit({ id: true, createdAt: true });
export const insertPlayerTraitSchema = createInsertSchema(playerTraitsTable).omit({ id: true, createdAt: true });
export type InsertTrait = z.infer<typeof insertTraitSchema>;
export type Trait = typeof traitsTable.$inferSelect;
export type PlayerTrait = typeof playerTraitsTable.$inferSelect;
