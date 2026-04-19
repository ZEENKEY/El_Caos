import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, inventoryTable } from "@workspace/db";
import {
  GetInventoryParams,
  AddInventoryItemParams,
  AddInventoryItemBody,
  RemoveInventoryItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/inventory/:playerId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const params = GetInventoryParams.safeParse({ playerId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const items = await db.select().from(inventoryTable).where(eq(inventoryTable.playerId, params.data.playerId));
  res.json(items);
});

router.post("/inventory/:playerId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const params = AddInventoryItemParams.safeParse({ playerId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db.insert(inventoryTable).values({
    playerId: params.data.playerId,
    ...parsed.data,
  }).returning();
  res.status(201).json(item);
});

router.delete("/inventory/:playerId/:itemId", async (req, res): Promise<void> => {
  const rawPlayerId = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const rawItemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const params = RemoveInventoryItemParams.safeParse({
    playerId: parseInt(rawPlayerId, 10),
    itemId: parseInt(rawItemId, 10),
  });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(inventoryTable).where(
    and(
      eq(inventoryTable.id, params.data.itemId),
      eq(inventoryTable.playerId, params.data.playerId)
    )
  );
  res.sendStatus(204);
});

export default router;
