import { Router, type IRouter } from "express";
import { desc, count, avg } from "drizzle-orm";
import { db, playersTable, eventsTable, missionsTable, gossipTable, gameLogsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [totalPlayersResult] = await db.select({ count: count() }).from(playersTable);
  const [totalEventsResult] = await db.select({ count: count() }).from(eventsTable);
  const [totalMissionsResult] = await db.select({ count: count() }).from(missionsTable);
  const [totalGossipResult] = await db.select({ count: count() }).from(gossipTable);
  const [avgMoneyResult] = await db.select({ avg: avg(playersTable.money) }).from(playersTable);

  const topPlayerRows = await db
    .select({ username: playersTable.username, money: playersTable.money })
    .from(playersTable)
    .orderBy(desc(playersTable.money))
    .limit(1);

  res.json({
    totalPlayers: Number(totalPlayersResult?.count ?? 0),
    activePlayers: Number(totalPlayersResult?.count ?? 0),
    totalEvents: Number(totalEventsResult?.count ?? 0),
    totalMissions: Number(totalMissionsResult?.count ?? 0),
    totalGossip: Number(totalGossipResult?.count ?? 0),
    averageMoney: Math.round(Number(avgMoneyResult?.avg ?? 0)),
    topPlayer: topPlayerRows[0]?.username ?? null,
  });
});

router.get("/admin/logs", async (_req, res): Promise<void> => {
  const logs = await db
    .select()
    .from(gameLogsTable)
    .orderBy(desc(gameLogsTable.createdAt))
    .limit(100);

  res.json(logs.map(l => ({
    ...l,
    playerName: null,
    createdAt: l.createdAt.toISOString(),
  })));
});

export default router;
