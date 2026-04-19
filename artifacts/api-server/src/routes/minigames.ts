import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, minigamesTable, playersTable, gameLogsTable, inventoryTable } from "@workspace/db";
import {
  CreateMinigameBody,
  UpdateMinigameParams,
  UpdateMinigameBody,
  PlayMinigameParams,
  PlayMinigameBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/minigames", async (_req, res): Promise<void> => {
  const minigames = await db.select().from(minigamesTable).where(eq(minigamesTable.isActive, true));
  res.json(minigames);
});

router.post("/minigames", async (req, res): Promise<void> => {
  const parsed = CreateMinigameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [minigame] = await db.insert(minigamesTable).values(parsed.data).returning();
  res.status(201).json(minigame);
});

router.patch("/minigames/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateMinigameParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMinigameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [minigame] = await db
    .update(minigamesTable)
    .set(parsed.data)
    .where(eq(minigamesTable.id, params.data.id))
    .returning();
  if (!minigame) {
    res.status(404).json({ error: "Minigame not found" });
    return;
  }
  res.json(minigame);
});

router.post("/minigames/:id/play", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = PlayMinigameParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = PlayMinigameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [minigame] = await db.select().from(minigamesTable).where(eq(minigamesTable.id, params.data.id));
  if (!minigame) {
    res.status(404).json({ error: "Minigame not found" });
    return;
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, parsed.data.playerId));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const accuracy = Math.max(0, Math.min(1, parsed.data.accuracy));
  const reward = Math.floor(minigame.baseReward * accuracy * (1 + parsed.data.score / 100));

  const funMessages = [
    accuracy > 0.8 ? "Eres un maestro del tiempo. Tu madre estaria orgullosa." : null,
    accuracy > 0.6 ? "Nada mal. El Oxxo te necesita." : null,
    accuracy > 0.4 ? "Meh. Hay dias mejores." : null,
    accuracy <= 0.4 ? "Hasta un taco de canasta lo hace mejor que tu." : null,
  ].filter(Boolean);

  const message = funMessages[0] ?? "Fin del turno.";

  await db.update(playersTable).set({
    money: player.money + reward,
  }).where(eq(playersTable.id, parsed.data.playerId));

  if (accuracy > 0.85 && Math.random() > 0.7) {
    const rareItems = [
      { itemName: "Sombrero de Mariachi Roto", emoji: "🎩", description: "Le falta el ala pero tiene historia", rarity: "rare", effect: "+5 reputacion cuando lo usas" },
      { itemName: "Chancla Magica", emoji: "🩴", description: "Nadie sabe por que, pero funciona", rarity: "epic", effect: "+10 velocidad movimiento" },
    ];
    const item = rareItems[Math.floor(Math.random() * rareItems.length)];
    await db.insert(inventoryTable).values({
      playerId: parsed.data.playerId,
      ...item,
      quantity: 1,
    });
  }

  await db.insert(gameLogsTable).values({
    playerId: parsed.data.playerId,
    action: "minigame_played",
    details: `${minigame.emoji} ${minigame.name} - Score: ${parsed.data.score}, Reward: $${reward}`,
  });

  res.json({
    success: true,
    score: parsed.data.score,
    reward,
    message,
    newMoney: player.money + reward,
  });
});

export default router;
