import dotenv from "dotenv";
dotenv.config();

function required(key:string):string {
    const v = process.env[key];
    if (!v) throw new Error(`Missing required env var: ${key}`);
    return v;
}

export const env = {
    port: process.env.PORT || "5000",
    databaseUrl: required("DATABASE_URL"),
    jwtSecret: required("JWT_SECRET"),
    jwtExpires: process.env.JWT_EXPIRES || "7d",
    holdTtlSeconds: Number(process.env.HOLD_TTL_SECONDS || 600),
    offerTtlSeconds: Number(process.env.OFFER_TTL_SECONDS || 600),
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
    frontendUrl : process.env.FRONTEND_URL || "http://localhost:5173",

    // When frontend and backend live on different domains (e.g. Vercel + Render)
    // the auth cookie must be SameSite=None; Secure to survive cross-site
    // requests. Enable by setting CROSS_SITE_COOKIES=true in production.
    // Left false locally so the cookie works over plain http://localhost.
    crossSiteCookies: process.env.CROSS_SITE_COOKIES === "true",

    // Branding used in emails / QR payloads
    appName: process.env.APP_NAME || "CineSeat",

    // How often the TTL sweeper runs (seconds)
    sweepIntervalSeconds: Number(process.env.SWEEP_INTERVAL_SECONDS || 30),

    // SMTP for ticket / waitlist-offer emails. If SMTP_HOST is unset we fall
    // back to an Ethereal test account (dev) and log a preview URL, so the app
    // works end-to-end without any real mail credentials.
    smtp: {
        host: process.env.SMTP_HOST || "",
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
        from: process.env.MAIL_FROM || "CineSeat <no-reply@cineseat.app>",
    },
};