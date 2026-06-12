import { useState } from 'react'
import { motion } from 'framer-motion'
import { Modal } from './Modal'
import { Button } from './Button'
import { useStore } from '../store'
import { sfx } from '../lib/sounds'

const CVALS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
const SUITS = [{ s:'♠',r:false },{ s:'♥',r:true },{ s:'♦',r:true },{ s:'♣',r:false }]

interface CardPickerModalProps {
  open: boolean
  target: string | null
  onClose: () => void
}

export function CardPickerModal({ open, target, onClose }: CardPickerModalProps) {
  const setLhCard = useStore(s => s.setLhCard)
  const [suit, setSuit] = useState<{ s: string; r: boolean } | null>(null)

  const pickVal = (v: string) => {
    if (!suit || !target) { alert('Pick a suit first.'); return }
    setLhCard(target, { v, s: suit.s, r: suit.r })
    sfx.card()
    setSuit(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={() => { setSuit(null); onClose() }} title="Pick Card">
      <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10, fontWeight: 600 }}>Suit</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
        {SUITS.map(su => (
          <motion.button
            key={su.s}
            whileTap={{ scale: 0.92 }}
            onClick={() => { setSuit(su); sfx.chip() }}
            style={{
              height: 56, borderRadius: 12,
              background: suit?.s === su.s ? 'rgba(212,168,67,.18)' : 'rgba(0,0,0,.3)',
              border: `1px solid ${suit?.s === su.s ? 'var(--gold)' : 'var(--border)'}`,
              fontSize: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: su.r ? '#d42020' : 'var(--t1)',
              boxShadow: suit?.s === su.s ? '0 0 12px rgba(212,168,67,.2)' : 'none',
              transition: 'all .15s',
            }}
          >
            {su.s}
          </motion.button>
        ))}
      </div>

      <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10, fontWeight: 600 }}>Value</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {CVALS.map(v => (
          <motion.button
            key={v}
            whileTap={{ scale: 0.9 }}
            onClick={() => pickVal(v)}
            style={{
              height: 44, borderRadius: 10,
              background: 'rgba(0,0,0,.3)',
              border: '1px solid var(--border)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: suit ? (suit.r ? '#d42020' : 'var(--t1)') : 'var(--t2)',
              transition: '.15s',
            }}
          >
            {v}
          </motion.button>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        <Button variant="ghost" full onClick={() => { setSuit(null); onClose() }}>Cancel</Button>
      </div>
    </Modal>
  )
}
