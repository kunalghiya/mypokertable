import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface ToastItem {
  id: number
  msg: string
  icon: string
}

let _push: ((msg: string, icon?: string) => void) | null = null

export function toast(msg: string, icon = '') {
  _push?.(msg, icon)
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([])
  let counter = 0

  const push = useCallback((msg: string, icon = '') => {
    const id = Date.now() + counter++
    setItems(prev => [...prev, { id, msg, icon }])
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  useEffect(() => { _push = push; return () => { _push = null } }, [push])

  return (
    <div style={{
      position: 'fixed',
      top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
      left: '50%', transform: 'translateX(-50%)',
      zIndex: 'var(--z-toast)' as any,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none', width: 'calc(100% - 32px)', maxWidth: 398,
    }}>
      <AnimatePresence>
        {items.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              background: 'oklch(24% 0.016 170 / 96%)',
              border: '1px solid var(--border-2)',
              borderRadius: 14, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, color: 'var(--ink)', fontWeight: 500,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 8px 32px oklch(0% 0 0 / 55%)',
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: 7, flexShrink: 0,
              background: 'var(--accent-dim)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12,
            }}>
              {t.icon || <Check size={13} strokeWidth={3} />}
            </span>
            <span>{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
