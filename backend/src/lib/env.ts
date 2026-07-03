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
};