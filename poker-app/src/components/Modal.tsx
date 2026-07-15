import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  icon?: ReactNode
  footer?: ReactNode
}

export function Modal({ open, onClose, children, title, icon, footer }: ModalProps) {
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
              maxHeight: '93dvh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 -12px 60px oklch(0% 0 0 / 55%)',
              zIndex: 'var(--z-sheet)' as any,
              overflow: 'hidden',
            }}
          >
            {/* Grab handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 14, flexShrink: 0 }}>
              <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--border-2)' }} />
            </div>

            {/* Scrollable body */}
            <div style={{
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: `0 18px ${footer ? '18px' : 'calc(env(safe-area-inset-bottom) + 18px)'}`,
              minHeight: 0,
            }}>
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
            </div>

            {/* Fixed footer — always visible, outside scroll area */}
            {footer && (
              <div style={{
                flexShrink: 0,
                padding: '12px 18px calc(env(safe-area-inset-bottom) + 16px)',
                borderTop: '1px solid var(--border)',
                background: 'var(--sheet)',
              }}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
