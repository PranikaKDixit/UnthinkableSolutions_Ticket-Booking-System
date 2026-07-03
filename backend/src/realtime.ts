import { Server as HttpServer } from "http";
import { Server as IOServer } from "socket.io";
import { env } from "./lib/env";

let io: IOServer | null = null;

/**
 * Attach a socket.io server to the given HTTP server.
 *
 * Clients join a per-show "room" so a seat change on one show only notifies
 * the customers currently looking at that show's seat map. The frontend
 * (`src/lib/socket.ts`) emits `show:join` / `show:leave` and listens for
 * `seat:update`.
 */
export function initRealtime(server: HttpServer): IOServer {
  io = new IOServer(server, {
    cors: { origin: env.corsOrigin, credentials: true },
  });

  io.on("connection", (socket) => {
    socket.on("show:join", (showId: string) => {
      if (typeof showId === "string" && showId) socket.join(room(showId));
    });
    socket.on("show:leave", (showId: string) => {
      if (typeof showId === "string" && showId) socket.leave(room(showId));
    });
  });

  return io;
}

function room(showId: string) {
  return `show:${showId}`;
}

/**
 * Tell everyone watching a show that its seat map changed. Called after every
 * hold / release / booking / cancellation / TTL expiry. Safe to call before
 * the socket server is initialised (no-op) so services never crash in tests.
 */
export function emitSeatUpdate(showId: string): void {
  io?.to(room(showId)).emit("seat:update", { showId });
}
