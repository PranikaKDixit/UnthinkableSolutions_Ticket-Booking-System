 import { Request, Response, NextFunction } from "express";
  import { verifyToken, JwtPayload } from "../lib/jwt";

  // Tell TypeScript that requests can carry a `user`
  declare global {
    namespace Express {
      interface Request {
        user?: JwtPayload;
      }
    }
  }

  export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });
    try {
      req.user = verifyToken(token);
      next();
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
  }

  // Like requireAuth but never rejects — attaches req.user when a valid cookie
  // is present, otherwise continues anonymously. Used by the public seat map so
  // it can flag "held by me" for logged-in customers.
  export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
    const token = req.cookies?.token;
    if (token) {
      try {
        req.user = verifyToken(token);
      } catch {
        /* ignore invalid token — treat as anonymous */
      }
    }
    next();
  }

  export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
      next();
    };
  }