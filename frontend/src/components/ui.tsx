import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

type Variant = 'primary' | 'gold' | 'ghost' | 'danger' | 'outline'

export function Button({
  variant = 'primary',
  loading,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  const styles: Record<Variant, string> = {
    primary: 'bg-neon hover:bg-neon-soft text-white shadow-glow',
    gold: 'bg-gold-sheen text-ink-950 font-semibold shadow-glow-gold hover:brightness-105',
    ghost: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
    outline: 'bg-transparent hover:bg-white/5 text-white border border-white/15',
    danger: 'bg-red-500/90 hover:bg-red-500 text-white',
  }
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium
        transition active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Input({
  label,
  hint,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      <input {...rest} className={`field ${className}`} />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export function Textarea({
  label,
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      <textarea {...rest} className={`field resize-none ${className}`} />
    </label>
  )
}

export function Select({
  label,
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      <select {...rest} className={`field appearance-none ${className}`}>
        {children}
      </select>
    </label>
  )
}

export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      className={`card p-5 ${hover ? 'transition-shadow hover:shadow-glow' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}

type Tone = 'neutral' | 'gold' | 'green' | 'red' | 'neon' | 'cyan'
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  const map: Record<Tone, string> = {
    neutral: 'bg-white/10 text-slate-300',
    gold: 'bg-gold/15 text-gold-soft',
    green: 'bg-emerald-500/15 text-emerald-300',
    red: 'bg-red-500/15 text-red-300',
    neon: 'bg-neon/15 text-neon-soft',
    cyan: 'bg-cyan-500/15 text-cyan-300',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}>
      {children}
    </span>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-neon" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 py-16 text-center">
      {icon && <div className="text-neon/70">{icon}</div>}
      <h3 className="text-lg">{title}</h3>
      {hint && <p className="max-w-sm text-sm text-slate-400">{hint}</p>}
      {action}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="skeleton mb-4 h-40 w-full" />
      <div className="skeleton mb-2 h-4 w-2/3" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  )
}
