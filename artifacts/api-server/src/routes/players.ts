import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, playersTable, charactersTable, housesTable, gossipTable, gameLogsTable, decisionsTable, locationsTable } from "@workspace/db";
import {
  CreatePlayerBody,
  GetPlayerParams,
  UpdatePlayerParams,
  UpdatePlayerBody,
  DeletePlayerParams,
  GetPlayerSummaryParams,
  MovePlayerParams,
  MovePlayerBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/players", async (_req, res): Promise<void> => {
  const players = await db.select().from(playersTable).orderBy(desc(playersTable.createdAt));
  res.json(players);
});

router.post("/players", async (req, res): Promise<void> => {
  const parsed = CreatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.username, parsed.data.username));

  if (existing.length > 0) {
    const player = existing[0];
    await db
      .update(playersTable)
      .set({ lastSeen: new Date() })
      .where(eq(playersTable.id, player.id));
    res.status(201).json({ ...player, lastSeen: new Date().toISOString() });
    return;
  }

  const [player] = await db.insert(playersTable).values({
    username: parsed.data.username,
    lastSeen: new Date(),
  }).returning();

  await db.insert(charactersTable).values({
    playerId: player.id,
    name: parsed.data.username,
    avatarEmoji: "😎",
  });

  const hexQ = Math.floor(Math.random() * 4) + 2;
  const hexR = Math.floor(Math.random() * 4) + 2;
  await db.insert(housesTable).values({
    playerId: player.id,
    hexQ,
    hexR,
    name: `Casa de ${parsed.data.username}`,
  });

  const randomDecisions = [
    {
      title: "El Taxi Misterioso",
      description: "Un taxi se detiene sin que lo llames. El chofer te mira con ojos de sospecha.",
      optionA: "Subir y preguntar a donde va",
      optionB: "Ignorarlo y seguir caminando",
      consequenceA: "Resulta que era el primo de tu exnovio. Awkward.",
      consequenceB: "El taxi choca justo donde estabas parado. Que buena decision.",
      moneyEffectA: -50, energyEffectA: -10, reputationEffectA: 5,
      moneyEffectB: 0, energyEffectB: 5, reputationEffectB: 10,
    },
    {
      title: "La Oferta del Oxxo",
      description: "El cajero te ofrece 3 papas por el precio de 2... pero solo si bailas.",
      optionA: "Bailar y llevarte las papas",
      optionB: "Pagar precio normal con dignidad",
      consequenceA: "El video termina en TikTok. Eres famoso por 2 dias.",
      consequenceB: "Te respetan. Nadie sabe que querias bailar.",
      moneyEffectA: -20, energyEffectA: 10, reputationEffectA: 15,
      moneyEffectB: -50, energyEffectB: 0, reputationEffectB: 5,
    },
  ];

  const randomDecision = randomDecisions[Math.floor(Math.random() * randomDecisions.length)];
  await db.insert(decisionsTable).values({ playerId: player.id, ...randomDecision });

  await db.insert(gameLogsTable).values({
    playerId: player.id,
    action: "player_created",
    details: `Nuevo jugador: ${parsed.data.username}`,
  });

  res.status(201).json(player);
});

router.get("/players/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPlayerParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, params.data.id));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  res.json(player);
});

router.patch("/players/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePlayerParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [player] = await db
    .update(playersTable)
    .set(parsed.data)
    .where(eq(playersTable.id, params.data.id))
    .returning();
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  res.json(player);
});

router.delete("/players/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeletePlayerParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(playersTable).where(eq(playersTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/players/:id/summary", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPlayerSummaryParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, params.data.id));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const recentGossip = await db
    .select()
    .from(gossipTable)
    .where(eq(gossipTable.aboutPlayerId, params.data.id))
    .orderBy(desc(gossipTable.createdAt))
    .limit(3);

  const absurdHeadlines = [
    "Alguien vio a tu personaje hablando con una paloma",
    "Tu reputacion en el Malecon es legendaria (por las razones incorrectas)",
    "El Oxxo de la esquina te tiene en la lista negra",
    "Tres taxistas estan hablando de ti en el grupo de WhatsApp",
    "Una seagull roba tu bolsa y la ciudad entera lo vio",
  ];

  const events = recentGossip.length > 0
    ? recentGossip.map(g => g.text)
    : [absurdHeadlines[Math.floor(Math.random() * absurdHeadlines.length)]];

  res.json({
    playerId: params.data.id,
    moneyGained: Math.floor(Math.random() * 200),
    moneyLost: Math.floor(Math.random() * 100),
    eventsOccurred: events,
    visitorsCount: Math.floor(Math.random() * 5),
    missionsCompleted: Math.floor(Math.random() * 2),
    headline: `Mientras no estabas... ${events[0]}`,
  });
});

router.post("/players/:id/move", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = MovePlayerParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = MovePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, params.data.id));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const energyCost = 5;
  if (player.energy < energyCost) {
    res.status(400).json({ error: "Not enough energy" });
    return;
  }

  await db
    .update(playersTable)
    .set({
      currentHexQ: parsed.data.hexQ,
      currentHexR: parsed.data.hexR,
      energy: player.energy - energyCost,
    })
    .where(eq(playersTable.id, params.data.id));

  const locationsAtHex = await db
    .select()
    .from(locationsTable)
    .where(
      and(
        eq(locationsTable.hexQ, parsed.data.hexQ),
        eq(locationsTable.hexR, parsed.data.hexR)
      )
    );

  const location = locationsAtHex[0] ?? null;

  await db.insert(gameLogsTable).values({
    playerId: params.data.id,
    action: "move",
    details: `Movio a hex (${parsed.data.hexQ}, ${parsed.data.hexR})${location ? ` - ${location.name}` : ""}`,
  });

  res.json({
    success: true,
    newHexQ: parsed.data.hexQ,
    newHexR: parsed.data.hexR,
    energyUsed: energyCost,
    locationName: location?.name ?? null,
    eventTriggered: null,
  });
});

export default router;
