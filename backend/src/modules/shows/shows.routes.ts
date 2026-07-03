 import { Router } from "express";
  import { requireAuth, requireRole, optionalAuth } from "../../middleware/auth";
  import { createShowSchema, seatIdsSchema, joinWaitlistSchema } from "./shows.schema";
  import {
    createShow,
    getShow,
    getShowSeats,
    holdSeats,
    releaseSeats,
    showSummary,
    joinWaitlist,
    myWaitlist,
  } from "./shows.service";

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

  // Public seat map — optionalAuth flags "held by me" for logged-in customers.
  router.get("/:showId/seats", optionalAuth, async (req, res) => {
    const seats = await getShowSeats(req.params.showId as string, req.user?.userId);
    res.json({ success: true, seats });
  });

  router.post("/:showId/hold", requireAuth, async (req, res) => {
    const { seatIds } = seatIdsSchema.parse(req.body);
    const result = await holdSeats(req.params.showId as string, req.user!.userId, seatIds);
    res.json({ success: true, seats: result.seats, holdExpiresAt: result.holdExpiresAt });
  });

  router.post("/:showId/release", requireAuth, async (req, res) => {
    const { seatIds } = seatIdsSchema.parse(req.body);
    const result = await releaseSeats(req.params.showId as string, req.user!.userId, seatIds);
    res.json({ success: true, ...result });
  });

  router.get("/:showId/summary", async (req, res) => {
    const summary = await showSummary(req.params.showId as string);
    res.json({ success: true, summary });
  });

  router.post("/:showId/waitlist", requireAuth, async (req, res) => {
    const { categoryId } = joinWaitlistSchema.parse(req.body);
    const entry = await joinWaitlist(req.params.showId as string, req.user!.userId, categoryId);
    res.status(201).json({ success: true, entry });
  });

  router.get("/:showId/waitlist/me", requireAuth, async (req, res) => {
    const entry = await myWaitlist(req.params.showId as string, req.user!.userId);
    res.json({ success: true, entry });
  });

  export default router;
