import { motion } from 'framer-motion'
import type { ReactNode, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'ai' | 'dashed' | 'gold'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  full?: boolean
  children: ReactNode
  size?: 'sm' | 'md'
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  primary: {
    background: 'var(--accent-strong)',
    color: 'var(--accent-ink)',
    boxShadow: '0 2px 16px oklch(74% 0.155 163 / 25%)',
  },
  ghost: {
    background: 'oklch(100% 0 0 / 4%)',
    color: 'var(--ink-2)',
    border: '1px solid var(--border-2)',
  },
  danger: {
    background: 'var(--neg-dim)',
    color: 'var(--neg)',
    border: '1px solid var(--neg-line)',
  },
  ai: {
    background: 'oklch(75% 0.14 300 / 12%)',
    color: 'oklch(80% 0.12 300)',
    border: '1px solid oklch(75% 0.14 300 / 30%)',
  },
  dashed: {
    background: 'none',
    color: 'var(--ink-3)',
    border: '1.5px dashed var(--border-2)',
    width: '100%',
  },
}
// Legacy alias so old call sites keep working
VARIANT_STYLES.gold = VARIANT_STYLES.primary

const SIZE_STYLES: Record<'sm' | 'md', React.CSSProperties> = {
  sm: { padding: '8px 13px',  fontSize: 12, borderRadius: 11, minHeight: 34 },
  md: { padding: '13px 20px', fontSize: 14, borderRadius: 14, minHeight: 48 },
}

export function Button({
  variant = 'ghost', full, children, size = 'md', style, className = '', ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        fontWeight: 600,
        cursor: 'pointer',
        border: 'none',
        userSelect: 'none',
        fontFamily: 'var(--fb)',
        letterSpacing: '-0.01em',
        width: full ? '100%' : undefined,
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
      }}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}
