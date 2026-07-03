import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { createVenueSchema, createCategorySchema, createSeatsSchema } from "./venues.schema";
import { createVenue, listVenues, createCategory, listCategories, createSeats, listSeats} from "./venues.service";

const router = Router();

// Only admins can create venues
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
const input = createVenueSchema.parse(req.body);
const venue = await createVenue(input);
res.status(201).json({ success: true, venue });
});

// Any logged-in user can list venues (organisers need them to make events)
router.get("/", requireAuth, async (_req, res) => {
    const venues = await listVenues();
    res.json({ success: true, venues });
});

 router.post("/:venueId/categories", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const venueId = req.params.venueId as string;
    const input = createCategorySchema.parse(req.body);
    const category = await createCategory(venueId, input);
    res.status(201).json({ success: true, category });
  });

router.get("/:venueId/categories", requireAuth, async (req, res) => {
    const venueId = req.params.venueId as string;
    const categories = await listCategories(venueId);
    res.json({ success: true, categories });
});

  router.post("/:venueId/seats", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const venueId = req.params.venueId as string;
    const input = createSeatsSchema.parse(req.body);
    const result = await createSeats(venueId, input);
    res.status(201).json({ success: true, created: result.count });
  });

  router.get("/:venueId/seats", requireAuth, async (req, res) => {
    const venueId = req.params.venueId as string;
    const seats = await listSeats(venueId);
    res.json({ success: true, seats });
  });

export default router;