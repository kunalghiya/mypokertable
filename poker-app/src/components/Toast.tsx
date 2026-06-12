import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface ToastItem {
  id: number
  msg: string
  icon: string
}

let _push: ((msg: string, icon?: string) => void) | null = null

export function toast(msg: string, icon = '✓') {
  _push?.(msg, icon)
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([])
  let counter = 0

  const push = useCallback((msg: string, icon = '✓') => {
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
      zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none', width: 'calc(100% - 32px)', maxWidth: 398,
    }}>
      <AnimatePresence>
        {items.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              background: 'rgba(20,16,38,.97)',
              border: '1px solid rgba(212,168,67,.22)',
              borderRadius: 16, padding: '13px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, color: 'var(--t1)', fontWeight: 500,
              backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 32px rgba(0,0,0,.6), inset 0 1px 0 rgba(212,168,67,.05)',
            }}
          >
            <span style={{ fontSize: 15, flexShrink: 0 }}>{t.icon}</span>
            <span>{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
