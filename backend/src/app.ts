  import "express-async-errors"; // makes async route errors reach our error handler
  import express from "express";
  import cors from "cors";
  import helmet from "helmet";
  import morgan from "morgan";
  import cookieParser from "cookie-parser";
  import { env } from "./lib/env";
  import authRoutes from "./modules/auth/auth.routes";
  import venueRoutes from "./modules/venues/venues.routes";
  import { errorHandler } from "./middleware/error";

  const app = express();

  app.use(helmet());
  app.use(morgan("dev"));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/", (_req, res) => {
    res.json({ success: true, message: "API running" });
  });

  app.use("/auth", authRoutes);
  
  app.use("/venues",venueRoutes);

  app.use(errorHandler); // MUST be last

  export default app;