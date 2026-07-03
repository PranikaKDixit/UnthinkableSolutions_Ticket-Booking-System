import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export function NotFound() {
  return (
    <div className="container-page flex min-h-[70svh] flex-col items-center justify-center text-center">
      <p className="font-display text-7xl font-extrabold gold-text">404</p>
      <h1 className="mt-4 text-2xl">Page not found</h1>
      <p className="mt-2 text-slate-400">The seat you're looking for doesn't exist.</p>
      <Link to="/" className="mt-6">
        <Button variant="gold">Back home</Button>
      </Link>
    </div>
  )
}
