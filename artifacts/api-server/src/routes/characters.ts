import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, charactersTable } from "@workspace/db";
import {
  GetCharacterParams,
  UpdateCharacterParams,
  UpdateCharacterBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/characters/:playerId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const params = GetCharacterParams.safeParse({ playerId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [character] = await db.select().from(charactersTable).where(eq(charactersTable.playerId, params.data.playerId));
  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }
  res.json(character);
});

router.patch("/characters/:playerId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const params = UpdateCharacterParams.safeParse({ playerId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCharacterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [character] = await db
    .update(charactersTable)
    .set(parsed.data)
    .where(eq(charactersTable.playerId, params.data.playerId))
    .returning();
  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }
  res.json(character);
});

export default router;
