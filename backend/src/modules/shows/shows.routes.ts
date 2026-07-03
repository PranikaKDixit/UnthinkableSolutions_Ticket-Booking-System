 import { Router } from "express";
  import { requireAuth, requireRole } from "../../middleware/auth";
  import { createShowSchema } from "./shows.schema";
  import { createShow, getShow } from "./shows.service";

  const router = Router();

  router.post("/", requireAuth, requireRole("ORGANISER"), async (req, res) => {
    const organiserId = req.user!.userId;
    const input = createShowSchema.parse(req.body);
    const show = await createShow(organiserId, input);
    res.status(201).json({ success: true, show });
  });

  router.get("/:showId", async (req, res) => {
    const showId = req.params.showId as string;
    const show = await getShow(showId);
    res.json({ success: true, show });
  });

  export default router;