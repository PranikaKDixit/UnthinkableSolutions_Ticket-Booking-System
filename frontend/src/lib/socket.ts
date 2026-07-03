import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    // Same-origin; Vite proxies /socket.io to the backend in dev.
    const url = (import.meta.env.VITE_API_URL as string | undefined) ?? '/'
    socket = io(url, { withCredentials: true, autoConnect: true })
  }
  return socket
}

/**
 * Subscribe to live seat-status changes for one show.
 * Backend is expected to emit `seat:update` to a per-show room.
 * Returns an unsubscribe function.
 */
export function subscribeSeats(showId: string, onUpdate: () => void): () => void {
  const s = getSocket()
  s.emit('show:join', showId)
  const handler = () => onUpdate()
  s.on('seat:update', handler)
  return () => {
    s.emit('show:leave', showId)
    s.off('seat:update', handler)
  }
}
