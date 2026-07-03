 import { Request, Response, NextFunction } from "express";
  import { ZodError } from "zod";
  import { HttpError } from "../lib/httpError";

  export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof ZodError) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: err.issues });
    }
    if (err instanceof HttpError) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }