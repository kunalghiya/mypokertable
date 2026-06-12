import { motion } from 'framer-motion'
import type { ReactNode, CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  glow?: 'gold' | 'violet' | 'green' | 'none'
  animate?: boolean
}

const GLOWS = {
  gold:   { boxShadow: '0 0 0 1px rgba(212,168,67,.2), 0 8px 32px rgba(0,0,0,.45), inset 0 1px 0 rgba(212,168,67,.08)' },
  violet: { boxShadow: '0 0 0 1px rgba(155,93,229,.2), 0 8px 32px rgba(0,0,0,.45), inset 0 1px 0 rgba(155,93,229,.06)' },
  green:  { boxShadow: '0 0 0 1px rgba(0,232,122,.2), 0 8px 32px rgba(0,0,0,.45), inset 0 1px 0 rgba(0,232,122,.06)' },
  none:   { boxShadow: '0 4px 24px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.025)' },
}

export function Card({ children, className = '', style, glow = 'none', animate = true }: CardProps) {
  const base = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '18px',
    marginBottom: 12,
    ...GLOWS[glow],
    ...style,
  }

  if (!animate) {
    return <div className={className} style={base}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      style={base}
      whileHover={{ y: -2, boxShadow: GLOWS[glow].boxShadow?.replace('0.4', '0.55') }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}

export function SectionLabel({ children, gold }: { children: ReactNode; gold?: boolean }) {
  return (
    <div style={{
      fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
      color: gold ? 'var(--gold)' : 'var(--t3)',
      marginBottom: 12, fontWeight: 600,
    }}>
      {children}
    </div>
  )
}
