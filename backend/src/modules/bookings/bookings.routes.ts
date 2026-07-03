import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { createBookingSchema } from "./bookings.schema";
import {
  createBooking,
  listBookings,
  getBooking,
  cancelBooking,
  acceptOffer,
} from "./bookings.service";

const router = Router();

// All booking routes require a logged-in user.
router.use(requireAuth);

router.post("/", async (req, res) => {
  const input = createBookingSchema.parse(req.body);
  const booking = await createBooking(req.user!.userId, input.showId, input.seatIds);
  res.status(201).json({ success: true, booking });
});

router.get("/", async (req, res) => {
  const bookings = await listBookings(req.user!.userId);
  res.json({ success: true, bookings });
});

router.get("/:bookingId", async (req, res) => {
  const booking = await getBooking(req.user!.userId, req.params.bookingId as string);
  res.json({ success: true, booking });
});

router.post("/:bookingId/cancel", async (req, res) => {
  const booking = await cancelBooking(req.user!.userId, req.params.bookingId as string);
  res.json({ success: true, booking });
});

export default router;

// Waitlist offer acceptance lives on its own mount point (POST /waitlist/offer/:token/accept).
export const waitlistOfferRouter = Router();
waitlistOfferRouter.use(requireAuth);
waitlistOfferRouter.post("/offer/:token/accept", async (req, res) => {
  const booking = await acceptOffer(req.user!.userId, req.params.token as string);
  res.json({ success: true, booking });
});
