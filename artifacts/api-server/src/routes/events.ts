import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, eventsTable, playersTable, gameLogsTable } from "@workspace/db";
import {
  CreateEventBody,
  UpdateEventParams,
  UpdateEventBody,
  DeleteEventParams,
  TriggerEventParams,
  TriggerEventBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/events", async (_req, res): Promise<void> => {
  const events = await db.select().from(eventsTable);
  res.json(events);
});

router.post("/events", async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [event] = await db.insert(eventsTable).values(parsed.data).returning();
  res.status(201).json(event);
});

router.patch("/events/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateEventParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [event] = await db
    .update(eventsTable)
    .set(parsed.data)
    .where(eq(eventsTable.id, params.data.id))
    .returning();
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(event);
});

router.delete("/events/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteEventParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(eventsTable).where(eq(eventsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/events/global", async (_req, res): Promise<void> => {
  const events = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.isGlobal, true), eq(eventsTable.isActive, true)));
  res.json(events);
});

router.post("/events/trigger/:playerId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const params = TriggerEventParams.safeParse({ playerId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = TriggerEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, params.data.playerId));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const eligibleEvents = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.isActive, true));

  if (eligibleEvents.length === 0) {
    res.json({ eventTriggered: false, event: null, message: "No events available" });
    return;
  }

  const triggered = eligibleEvents.find(e => Math.random() < e.probability);

  if (!triggered) {
    res.json({ eventTriggered: false, event: null, message: "La suerte no te sonrio hoy" });
    return;
  }

  await db.update(playersTable).set({
    money: Math.max(0, player.money + triggered.moneyEffect),
    energy: Math.max(0, Math.min(100, player.energy + triggered.energyEffect)),
    reputation: Math.max(0, Math.min(100, player.reputation + triggered.reputationEffect)),
  }).where(eq(playersTable.id, params.data.playerId));

  await db.insert(gameLogsTable).values({
    playerId: params.data.playerId,
    action: "event_triggered",
    details: `${triggered.emoji} ${triggered.name}: ${triggered.description}`,
  });

  res.json({
    eventTriggered: true,
    event: {
      id: triggered.id,
      name: triggered.name,
      description: triggered.description,
      emoji: triggered.emoji,
      moneyEffect: triggered.moneyEffect,
      energyEffect: triggered.energyEffect,
      reputationEffect: triggered.reputationEffect,
    },
    message: `${triggered.emoji} ${triggered.name}`,
  });
});

export default router;
