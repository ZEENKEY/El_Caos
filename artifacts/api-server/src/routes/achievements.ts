import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, achievementsTable, playerAchievementsTable } from "@workspace/db";
import {
  GetPlayerAchievementsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/achievements", async (_req, res): Promise<void> => {
  const achievements = await db.select().from(achievementsTable);
  res.json(achievements);
});

router.get("/achievements/:playerId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const params = GetPlayerAchievementsParams.safeParse({ playerId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const playerAchievements = await db
    .select({
      id: playerAchievementsTable.id,
      playerId: playerAchievementsTable.playerId,
      achievementId: playerAchievementsTable.achievementId,
      achievementName: achievementsTable.name,
      achievementEmoji: achievementsTable.emoji,
      unlockedAt: playerAchievementsTable.unlockedAt,
    })
    .from(playerAchievementsTable)
    .leftJoin(achievementsTable, eq(playerAchievementsTable.achievementId, achievementsTable.id))
    .where(eq(playerAchievementsTable.playerId, params.data.playerId));

  res.json(playerAchievements.map(a => ({
    ...a,
    achievementName: a.achievementName ?? "Unknown",
    achievementEmoji: a.achievementEmoji ?? "🏆",
    unlockedAt: a.unlockedAt.toISOString(),
  })));
});

export default router;
