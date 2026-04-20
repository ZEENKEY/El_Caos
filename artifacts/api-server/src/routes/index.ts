import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playersRouter from "./players";
import charactersRouter from "./characters";
import locationsRouter from "./locations";
import eventsRouter from "./events";
import minigamesRouter from "./minigames";
import missionsRouter from "./missions";
import inventoryRouter from "./inventory";
import npcsRouter from "./npcs";
import socialRouter from "./social";
import achievementsRouter from "./achievements";
import traitsRouter from "./traits";
import adminRouter from "./admin";
import consolaRouter from "./consola";

const router: IRouter = Router();

router.use(consolaRouter);
router.use(healthRouter);
router.use(playersRouter);
router.use(charactersRouter);
router.use(locationsRouter);
router.use(eventsRouter);
router.use(minigamesRouter);
router.use(missionsRouter);
router.use(inventoryRouter);
router.use(npcsRouter);
router.use(socialRouter);
router.use(achievementsRouter);
router.use(traitsRouter);
router.use(adminRouter);

export default router;
