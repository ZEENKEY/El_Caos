import { pgTable, text, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull().default("random"),
  probability: real("probability").notNull().default(0.3),
  moneyEffect: integer("money_effect").notNull().default(0),
  energyEffect: integer("energy_effect").notNull().default(0),
  reputationEffect: integer("reputation_effect").notNull().default(0),
  isGlobal: boolean("is_global").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  emoji: text("emoji").notNull().default("🎲"),
  locationId: integer("location_id"),
  chainedEventId: integer("chained_event_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
