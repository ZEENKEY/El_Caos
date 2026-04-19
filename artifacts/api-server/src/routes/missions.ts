import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, missionsTable, playersTable, gameLogsTable, gossipTable } from "@workspace/db";
import {
  CreateMissionBody,
  UpdateMissionParams,
  UpdateMissionBody,
  DeleteMissionParams,
  CompleteMissionParams,
  CompleteMissionBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/missions", async (_req, res): Promise<void> => {
  const missions = await db.select().from(missionsTable).orderBy(desc(missionsTable.createdAt));
  res.json(missions);
});

router.post("/missions", async (req, res): Promise<void> => {
  const parsed = CreateMissionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [mission] = await db.insert(missionsTable).values(parsed.data).returning();
  res.status(201).json(mission);
});

router.patch("/missions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateMissionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMissionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [mission] = await db
    .update(missionsTable)
    .set(parsed.data)
    .where(eq(missionsTable.id, params.data.id))
    .returning();
  if (!mission) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }
  res.json(mission);
});

router.delete("/missions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteMissionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(missionsTable).where(eq(missionsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/missions/:id/complete", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CompleteMissionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CompleteMissionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [mission] = await db.select().from(missionsTable).where(eq(missionsTable.id, params.data.id));
  if (!mission) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }

  if (mission.status !== "active") {
    res.status(400).json({ error: "Mission already completed" });
    return;
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, parsed.data.playerId));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  await db.update(missionsTable).set({ status: "completed" }).where(eq(missionsTable.id, params.data.id));
  await db.update(playersTable).set({ money: player.money + mission.reward }).where(eq(playersTable.id, parsed.data.playerId));

  await db.insert(gossipTable).values({
    text: `${player.username} completo la mision "${mission.title}" y gano $${mission.reward}. Nadie lo vio venir.`,
    aboutPlayerId: parsed.data.playerId,
  });

  await db.insert(gameLogsTable).values({
    playerId: parsed.data.playerId,
    action: "mission_completed",
    details: `Mision completada: ${mission.title}, reward: $${mission.reward}`,
  });

  res.json({
    success: true,
    message: `Mision completada! ${player.username} ya puede presumir en el Malecon.`,
    rewardEarned: mission.reward,
  });
});

export default router;
