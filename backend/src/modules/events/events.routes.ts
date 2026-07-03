 import { Router } from "express";
  import { requireAuth, requireRole } from "../../middleware/auth";
  import { createEventSchema } from "./events.schema";
  import { createEvent, listEvents, getEvent } from "./events.service";

  const router = Router();

  // Organisers create events (owned by the logged-in organiser)
  router.post("/", requireAuth, requireRole("ORGANISER"), async (req, res) => {
    const organiserId = req.user!.userId;
    const input = createEventSchema.parse(req.body);
    const event = await createEvent(organiserId, input);
    res.status(201).json({ success: true, event });
  });

  // Public browse + filter
  router.get("/", async (req, res) => {
    const type = req.query.type as string | undefined;
    const events = await listEvents(type);
    res.json({ success: true, events });
  });

  // Public event detail
  router.get("/:eventId", async (req, res) => {
    const eventId = req.params.eventId as string;
    const event = await getEvent(eventId);
    res.json({ success: true, event });
  });

export default router;