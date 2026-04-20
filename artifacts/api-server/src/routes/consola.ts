import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, gameLogsTable } from "@workspace/db";

const router: IRouter = Router();

const frontendErrors: Array<{
  id: number;
  timestamp: string;
  action: string;
  message: string;
  url: string;
  context: object | null;
  userAgent: string;
}> = [];
let nextId = 1;

router.post("/consola/log", (req, res): void => {
  const { action, message, url, context } = req.body ?? {};
  const userAgent = req.headers["user-agent"] ?? "";
  frontendErrors.push({
    id: nextId++,
    timestamp: new Date().toISOString(),
    action: action ?? "unknown",
    message: message ?? "",
    url: url ?? "",
    context: context ?? null,
    userAgent,
  });
  if (frontendErrors.length > 500) frontendErrors.shift();
  res.json({ ok: true });
});

router.get("/consola/errors", (_req, res): void => {
  res.json([...frontendErrors].reverse());
});

router.get("/consola/logs", async (_req, res): Promise<void> => {
  const logs = await db
    .select()
    .from(gameLogsTable)
    .orderBy(desc(gameLogsTable.createdAt))
    .limit(200);
  res.json(logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })));
});

export default router;
