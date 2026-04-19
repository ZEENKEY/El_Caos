import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, locationsTable, housesTable, playersTable } from "@workspace/db";
import {
  CreateLocationBody,
  UpdateLocationParams,
  UpdateLocationBody,
  DeleteLocationParams,
  GetHouseParams,
  UpdateHouseParams,
  UpdateHouseBody,
  VisitHouseParams,
  VisitHouseBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/locations", async (_req, res): Promise<void> => {
  const locations = await db.select().from(locationsTable);
  res.json(locations);
});

router.post("/locations", async (req, res): Promise<void> => {
  const parsed = CreateLocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [location] = await db.insert(locationsTable).values(parsed.data).returning();
  res.status(201).json(location);
});

router.patch("/locations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateLocationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateLocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [location] = await db
    .update(locationsTable)
    .set(parsed.data)
    .where(eq(locationsTable.id, params.data.id))
    .returning();
  if (!location) {
    res.status(404).json({ error: "Location not found" });
    return;
  }
  res.json(location);
});

router.delete("/locations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteLocationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(locationsTable).where(eq(locationsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/houses", async (_req, res): Promise<void> => {
  const houses = await db
    .select({
      id: housesTable.id,
      playerId: housesTable.playerId,
      playerName: playersTable.username,
      hexQ: housesTable.hexQ,
      hexR: housesTable.hexR,
      name: housesTable.name,
      style: housesTable.style,
      color: housesTable.color,
      decoration: housesTable.decoration,
      visitCount: housesTable.visitCount,
    })
    .from(housesTable)
    .leftJoin(playersTable, eq(housesTable.playerId, playersTable.id));
  res.json(houses.map(h => ({ ...h, playerName: h.playerName ?? "Unknown" })));
});

router.get("/houses/:playerId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const params = GetHouseParams.safeParse({ playerId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const result = await db
    .select({
      id: housesTable.id,
      playerId: housesTable.playerId,
      playerName: playersTable.username,
      hexQ: housesTable.hexQ,
      hexR: housesTable.hexR,
      name: housesTable.name,
      style: housesTable.style,
      color: housesTable.color,
      decoration: housesTable.decoration,
      visitCount: housesTable.visitCount,
    })
    .from(housesTable)
    .leftJoin(playersTable, eq(housesTable.playerId, playersTable.id))
    .where(eq(housesTable.playerId, params.data.playerId));
  if (result.length === 0) {
    res.status(404).json({ error: "House not found" });
    return;
  }
  const h = result[0];
  res.json({ ...h, playerName: h.playerName ?? "Unknown" });
});

router.patch("/houses/:playerId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const params = UpdateHouseParams.safeParse({ playerId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateHouseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [house] = await db
    .update(housesTable)
    .set(parsed.data)
    .where(eq(housesTable.playerId, params.data.playerId))
    .returning();
  if (!house) {
    res.status(404).json({ error: "House not found" });
    return;
  }
  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, house.playerId));
  res.json({ ...house, playerName: player?.username ?? "Unknown" });
});

router.post("/houses/:playerId/visit", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const params = VisitHouseParams.safeParse({ playerId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = VisitHouseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [house] = await db.select().from(housesTable).where(eq(housesTable.playerId, params.data.playerId));
  if (!house) {
    res.status(404).json({ error: "House not found" });
    return;
  }

  await db
    .update(housesTable)
    .set({ visitCount: house.visitCount + 1 })
    .where(eq(housesTable.playerId, params.data.playerId));

  const reward = Math.floor(Math.random() * 30) + 10;
  const messages = [
    "Tocaste el timbre 47 veces. Alguien abrio.",
    "Entraste, comiste tacos de la cocina y saliste sin que nadie se diera cuenta.",
    "El perro de la casa te siguio 3 manzanas.",
    "Dejaste un regalo que nadie pidio. Era una sandalia.",
  ];

  res.json({
    success: true,
    message: messages[Math.floor(Math.random() * messages.length)],
    rewardMoney: reward,
  });
});

export default router;
