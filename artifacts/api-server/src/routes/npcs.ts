import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, npcsTable } from "@workspace/db";
import {
  CreateNpcBody,
  UpdateNpcParams,
  UpdateNpcBody,
  DeleteNpcParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/npcs", async (_req, res): Promise<void> => {
  const npcs = await db.select().from(npcsTable).where(eq(npcsTable.isActive, true));
  res.json(npcs);
});

router.post("/npcs", async (req, res): Promise<void> => {
  const parsed = CreateNpcBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [npc] = await db.insert(npcsTable).values(parsed.data).returning();
  res.status(201).json(npc);
});

router.patch("/npcs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateNpcParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateNpcBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [npc] = await db
    .update(npcsTable)
    .set(parsed.data)
    .where(eq(npcsTable.id, params.data.id))
    .returning();
  if (!npc) {
    res.status(404).json({ error: "NPC not found" });
    return;
  }
  res.json(npc);
});

router.delete("/npcs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteNpcParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(npcsTable).where(eq(npcsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
