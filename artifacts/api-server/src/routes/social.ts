import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, gossipTable, decisionsTable, playersTable, gameLogsTable } from "@workspace/db";
import {
  GenerateGossipBody,
  GetPlayerDecisionsParams,
  MakeDecisionBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const gossipTemplates = [
  "{player} intento entrar al antro con chanclas. El bounceer dice que fue lo mas valiente que ha visto.",
  "{player} le grito a una paloma en el Malecon y la paloma le grito de vuelta.",
  "Alguien vio a {player} contando sus tacos en el Oxxo. Habia 47.",
  "{player} le pregunto al taxista si aceptaba pesos... en dolares.",
  "El vecino de {player} jura que vio su casa moverse un metro a la izquierda.",
  "{player} gano una apuesta absurda y ahora debe silbar el himno nacional montado en un pato.",
  "Fuentes confiables dicen que {player} tiene un pacto con los cocodrilos del Nichupte.",
  "{player} fue visto comprando 3 paraguas en un dia soleado. Nadie sabe por que.",
];

const actionGossipMap: Record<string, string[]> = {
  minigame: [
    "{player} trabajo tanto que el cajero del Oxxo le pidio autografo.",
    "{player} rompió el record del antro. Ahora los tacos lo reconocen.",
  ],
  move: [
    "{player} se perdio 3 veces en la misma manzana. GPS mental desactivado.",
    "{player} cruzo el Crucero sin mirar. Un taxista llora de alegria.",
  ],
  visit: [
    "{player} visito la casa de alguien y se quedo 3 horas sin que nadie lo invitara.",
    "{player} llego, ceno, y se fue. El dueno nunca lo conocio.",
  ],
  default: gossipTemplates,
};

router.get("/social/gossip", async (_req, res): Promise<void> => {
  const gossip = await db
    .select({
      id: gossipTable.id,
      text: gossipTable.text,
      aboutPlayerId: gossipTable.aboutPlayerId,
      aboutPlayerName: playersTable.username,
      createdAt: gossipTable.createdAt,
    })
    .from(gossipTable)
    .leftJoin(playersTable, eq(gossipTable.aboutPlayerId, playersTable.id))
    .orderBy(desc(gossipTable.createdAt))
    .limit(50);
  res.json(gossip.map(g => ({
    ...g,
    aboutPlayerName: g.aboutPlayerName ?? null,
    createdAt: g.createdAt.toISOString(),
  })));
});

router.post("/social/gossip", async (req, res): Promise<void> => {
  const parsed = GenerateGossipBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, parsed.data.playerId));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const templates = actionGossipMap[parsed.data.action] ?? actionGossipMap.default;
  const template = templates[Math.floor(Math.random() * templates.length)];
  const text = template.replace(/{player}/g, player.username);

  const [gossip] = await db.insert(gossipTable).values({
    text,
    aboutPlayerId: parsed.data.playerId,
  }).returning();

  res.status(201).json({
    id: gossip.id,
    text: gossip.text,
    aboutPlayerId: gossip.aboutPlayerId ?? null,
    aboutPlayerName: player.username,
    createdAt: gossip.createdAt.toISOString(),
  });
});

router.get("/social/decisions/:playerId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const params = GetPlayerDecisionsParams.safeParse({ playerId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const decisions = await db
    .select()
    .from(decisionsTable)
    .where(eq(decisionsTable.playerId, params.data.playerId))
    .orderBy(desc(decisionsTable.createdAt));
  res.json(decisions.map(d => ({ ...d, createdAt: d.createdAt.toISOString() })));
});

router.post("/social/decisions/:playerId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const playerId = parseInt(raw, 10);
  const parsed = MakeDecisionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [decision] = await db
    .select()
    .from(decisionsTable)
    .where(eq(decisionsTable.id, parsed.data.decisionId));
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, playerId));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const isA = parsed.data.choice === "A";
  const moneyEffect = isA ? decision.moneyEffectA : decision.moneyEffectB;
  const energyEffect = isA ? decision.energyEffectA : decision.energyEffectB;
  const reputationEffect = isA ? decision.reputationEffectA : decision.reputationEffectB;
  const consequence = isA ? decision.consequenceA : decision.consequenceB;

  await db.update(decisionsTable)
    .set({ isResolved: true })
    .where(eq(decisionsTable.id, decision.id));

  await db.update(playersTable).set({
    money: Math.max(0, player.money + moneyEffect),
    energy: Math.max(0, Math.min(100, player.energy + energyEffect)),
    reputation: Math.max(0, Math.min(100, player.reputation + reputationEffect)),
  }).where(eq(playersTable.id, playerId));

  await db.insert(gameLogsTable).values({
    playerId,
    action: "decision_made",
    details: `Decision: ${decision.title}, Choice: ${parsed.data.choice} - ${consequence}`,
  });

  res.json({
    success: true,
    consequence,
    moneyEffect,
    energyEffect,
    reputationEffect,
  });
});

export default router;
