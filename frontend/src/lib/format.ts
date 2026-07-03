export const rupees = (n: number) => '₹' + (n ?? 0).toLocaleString('en-IN')

export const dateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

export const dateShort = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

/** Seconds remaining until an ISO timestamp (never negative). */
export const timeLeft = (iso?: string | null) => {
  if (!iso) return 0
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000))
}

export const mmss = (secs: number) =>
  `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

export const initials = (name?: string) =>
  (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
