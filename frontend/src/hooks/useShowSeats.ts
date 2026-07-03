import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { showsApi } from '../api'
import { subscribeSeats } from '../lib/socket'

/**
 * Seat map for a show, kept fresh in two ways:
 *  - react-query poll (fallback if sockets are unavailable)
 *  - socket `seat:update` events (instant, real-time)
 */
export function useShowSeats(showId: string | undefined) {
  const query = useQuery({
    queryKey: ['show-seats', showId],
    queryFn: () => showsApi.seats(showId!),
    enabled: !!showId,
    refetchInterval: 20_000,
  })

  useEffect(() => {
    if (!showId) return
    const unsub = subscribeSeats(showId, () => query.refetch())
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showId])

  return query
}
