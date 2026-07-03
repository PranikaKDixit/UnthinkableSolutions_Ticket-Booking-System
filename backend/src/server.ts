import "express-async-errors";
import dotenv from "dotenv";
dotenv.config();
import http from "http";
import app from "./app";
import { initRealtime } from "./realtime";
import { startScheduler } from "./scheduler";

const PORT = process.env.PORT || 5000;

// Wrap Express in a raw HTTP server so socket.io can share the same port.
const server = http.createServer(app);

// Real-time seat updates (socket.io) + the seat-hold / waitlist TTL sweeper.
initRealtime(server);
startScheduler();

server.listen(PORT, () => {
  console.log(`running on : ${PORT}`);
});
