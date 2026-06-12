import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export function Modal({ open, onClose, children, title }: ModalProps) {
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
            background: 'rgba(0,0,0,.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 200,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ y: 80, opacity: 0.4 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            style={{
              background: 'var(--modal)',
              border: '1px solid var(--border)',
              borderTop: '1px solid rgba(212,168,67,.1)',
              borderRadius: '28px 28px 0 0',
              width: '100%', maxWidth: 430,
              maxHeight: '93vh', overflowY: 'auto',
              padding: '24px 18px 40px',
              WebkitOverflowScrolling: 'touch',
              boxShadow: '0 -12px 60px rgba(0,0,0,.6)',
            }}
          >
            {title && (
              <div style={{
                fontFamily: 'var(--fs)',
                fontSize: 20, fontWeight: 900,
                color: 'var(--t1)',
                marginBottom: 20,
                letterSpacing: '-0.3px',
              }}>
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
