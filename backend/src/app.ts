// Must be imported before Express is loaded anywhere so it can patch the Router
// to forward async handler rejections to the error middleware.
import "express-async-errors";
import showRoutes from "./modules/shows/shows.routes";
  import express from "express";
  import cors from "cors";
  import helmet from "helmet";
  import morgan from "morgan";
  import cookieParser from "cookie-parser";
  import { env } from "./lib/env";
  import authRoutes from "./modules/auth/auth.routes";
  import venueRoutes from "./modules/venues/venues.routes";
  import eventRoutes from "./modules/events/events.routes";
  import bookingRoutes, { waitlistOfferRouter } from "./modules/bookings/bookings.routes";
  import { errorHandler } from "./middleware/error";

  const app = express();


  app.use(helmet());
  app.use(morgan("dev"));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());      // parses req.body
  app.use(cookieParser());      // parses req.cookies

  app.get("/", (_req, res) => {
    res.json({ success: true, message: "API running" });
  });

  app.use("/auth", authRoutes);
  app.use("/venues", venueRoutes);
  app.use("/events", eventRoutes);
  app.use("/shows", showRoutes);
  app.use("/bookings", bookingRoutes);
  app.use("/waitlist", waitlistOfferRouter);

  app.use(errorHandler);

  export default app;