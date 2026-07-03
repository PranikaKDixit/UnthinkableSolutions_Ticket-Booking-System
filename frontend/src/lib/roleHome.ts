import type { Role } from '../types'

/** Where each role lands after auth. */
export function roleHome(role: Role): string {
  switch (role) {
    case 'ORGANISER':
      return '/organiser'
    case 'ADMIN':
      return '/admin/venues'
    default:
      return '/events'
  }
}
