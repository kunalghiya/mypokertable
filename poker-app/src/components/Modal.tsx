import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  icon?: ReactNode
}

export function Modal({ open, onClose, children, title, icon }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
          style={{
            position: 'fixed', inset: 0,
            background: 'oklch(0% 0 0 / 65%)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 'var(--z-sheet-backdrop)' as any,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
            style={{
              background: 'var(--sheet)',
              borderTop: '1px solid var(--border-2)',
              borderRadius: '24px 24px 0 0',
              width: '100%', maxWidth: 430,
              maxHeight: '93dvh', overflowY: 'auto',
              padding: '10px 18px calc(env(safe-area-inset-bottom) + 28px)',
              WebkitOverflowScrolling: 'touch',
              boxShadow: '0 -12px 60px oklch(0% 0 0 / 55%)',
              zIndex: 'var(--z-sheet)' as any,
            }}
          >
            {/* Grab handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 14 }}>
              <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--border-2)' }} />
            </div>
            {title && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9,
                fontSize: 19, fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: 18,
                letterSpacing: '-0.02em',
              }}>
                {icon && <span style={{ display: 'inline-flex', color: 'var(--accent)' }}>{icon}</span>}
                {title}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
