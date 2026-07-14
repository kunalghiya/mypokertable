import type { ReactNode, CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  glow?: 'gold' | 'violet' | 'green' | 'accent' | 'none'
  animate?: boolean
}

export function Card({ children, className = '', style, glow = 'none' }: CardProps) {
  const accented = glow !== 'none'
  return (
    <div
      className={`panel ${className}`}
      style={{
        padding: 18,
        marginBottom: 12,
        borderColor: accented ? 'var(--accent-line)' : undefined,
        boxShadow: accented
          ? '0 8px 32px oklch(0% 0 0 / 35%), inset 0 1px 0 oklch(82% 0.16 163 / 6%)'
          : '0 4px 20px oklch(0% 0 0 / 25%)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function SectionLabel({ children, gold, accent }: { children: ReactNode; gold?: boolean; accent?: boolean }) {
  return (
    <div className={`label ${gold || accent ? 'accent' : ''}`} style={{ marginBottom: 13 }}>
      {children}
    </div>
  )
}
