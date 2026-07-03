  import { Router } from "express";
  import { registerSchema, loginSchema } from "./auth.schema";
  import { registerUser, loginUser } from "./auth.service";
  import { requireAuth } from "../../middleware/auth";
  import { prisma } from "../../lib/prisma";
  import { env } from "../../lib/env";

  const router = Router();

  const cookieOpts = {
    httpOnly: true,
    // Cross-site (Vercel <-> Render) needs SameSite=None + Secure; locally we
    // stay on lax + insecure so the cookie works over http://localhost.
    sameSite: (env.crossSiteCookies ? "none" : "lax") as "none" | "lax",
    secure: env.crossSiteCookies, // "none" requires Secure; prod is HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  router.post("/register", async (req, res) => {
    const input = registerSchema.parse(req.body);
    const { user, token } = await registerUser(input);
    res.cookie("token", token, cookieOpts);
    res.status(201).json({ success: true, user });
  });

  router.post("/login", async (req, res) => {
    const input = loginSchema.parse(req.body);
    const { user, token } = await loginUser(input);
    res.cookie("token", token, cookieOpts);
    res.json({ success: true, user });
  });

  router.post("/logout", (_req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  router.get("/me", requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json({ success: true, user });
  });

  export default router;