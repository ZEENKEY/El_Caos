import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gossipTable = pgTable("gossip", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  aboutPlayerId: integer("about_player_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const decisionsTable = pgTable("decisions", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  consequenceA: text("consequence_a").notNull(),
  consequenceB: text("consequence_b").notNull(),
  moneyEffectA: integer("money_effect_a").notNull().default(0),
  energyEffectA: integer("energy_effect_a").notNull().default(0),
  reputationEffectA: integer("reputation_effect_a").notNull().default(0),
  moneyEffectB: integer("money_effect_b").notNull().default(0),
  energyEffectB: integer("energy_effect_b").notNull().default(0),
  reputationEffectB: integer("reputation_effect_b").notNull().default(0),
  isResolved: boolean("is_resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGossipSchema = createInsertSchema(gossipTable).omit({ id: true, createdAt: true });
export const insertDecisionSchema = createInsertSchema(decisionsTable).omit({ id: true, createdAt: true });
export type InsertGossip = z.infer<typeof insertGossipSchema>;
export type Gossip = typeof gossipTable.$inferSelect;
export type Decision = typeof decisionsTable.$inferSelect;
