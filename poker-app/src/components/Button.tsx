import { motion } from 'framer-motion'
import type { ReactNode, ButtonHTMLAttributes } from 'react'

type Variant = 'gold' | 'ghost' | 'danger' | 'ai' | 'dashed'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  full?: boolean
  children: ReactNode
  size?: 'sm' | 'md'
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  gold:   { background: 'linear-gradient(135deg,#e0b84a,#b8882c)', color: '#07050f', boxShadow: '0 4px 20px rgba(212,168,67,.3), inset 0 1px 0 rgba(255,255,255,.15)' },
  ghost:  { background: 'rgba(255,255,255,.03)', color: 'var(--t2)', border: '1px solid var(--border2)' },
  danger: { background: 'rgba(255,51,85,.07)',   color: 'var(--red)', border: '1px solid rgba(255,51,85,.25)' },
  ai:     { background: 'linear-gradient(90deg,#3b1080,#7c1a0a)', color: '#fff' },
  dashed: { background: 'none', color: 'var(--t3)', border: '1px solid var(--border2)', width: '100%' },
}

const SIZE_STYLES: Record<'sm' | 'md', React.CSSProperties> = {
  sm: { padding: '7px 12px',  fontSize: 11, borderRadius: 10 },
  md: { padding: '13px 20px', fontSize: 14, borderRadius: 14 },
}

export function Button({
  variant = 'ghost', full, children, size = 'md', style, className = '', ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ filter: 'brightness(1.08)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontWeight: 600,
        cursor: 'pointer',
        border: 'none',
        transition: 'all .15s',
        userSelect: 'none',
        fontFamily: 'var(--fb)',
        width: full ? '100%' : undefined,
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,          // caller overrides come last — but size is already set above
      }}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}
