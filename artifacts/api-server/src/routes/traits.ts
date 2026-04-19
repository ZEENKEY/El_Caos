import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, traitsTable, playerTraitsTable } from "@workspace/db";
import {
  GetPlayerTraitsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/traits", async (_req, res): Promise<void> => {
  const traits = await db.select().from(traitsTable);
  res.json(traits);
});

router.get("/traits/:playerId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const params = GetPlayerTraitsParams.safeParse({ playerId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const playerTraits = await db
    .select({
      id: playerTraitsTable.id,
      playerId: playerTraitsTable.playerId,
      traitId: playerTraitsTable.traitId,
      traitName: traitsTable.name,
      traitEmoji: traitsTable.emoji,
      level: playerTraitsTable.level,
    })
    .from(playerTraitsTable)
    .leftJoin(traitsTable, eq(playerTraitsTable.traitId, traitsTable.id))
    .where(eq(playerTraitsTable.playerId, params.data.playerId));

  res.json(playerTraits.map(t => ({
    ...t,
    traitName: t.traitName ?? "Unknown",
    traitEmoji: t.traitEmoji ?? "✨",
  })));
});

export default router;
