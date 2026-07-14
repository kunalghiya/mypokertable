import { useState } from 'react'
import { motion } from 'framer-motion'
import { Spade } from 'lucide-react'
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
    <Modal open={open} onClose={() => { setSuit(null); onClose() }} title="Pick card" icon={<Spade size={18} strokeWidth={2.2} fill="currentColor" />}>
      <div className="label accent" style={{ marginBottom: 10 }}>Suit</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
        {SUITS.map(su => (
          <motion.button
            key={su.s}
            whileTap={{ scale: 0.92 }}
            onClick={() => { setSuit(su); sfx.chip() }}
            style={{
              height: 58, borderRadius: 13,
              background: suit?.s === su.s ? 'var(--accent-dim)' : 'oklch(0% 0 0 / 25%)',
              border: `1px solid ${suit?.s === su.s ? 'var(--accent-line)' : 'var(--border)'}`,
              fontSize: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: su.r ? 'oklch(65% 0.19 25)' : 'var(--ink)',
              transition: 'background .15s, border-color .15s',
            }}
          >
            {su.s}
          </motion.button>
        ))}
      </div>

      <div className="label accent" style={{ marginBottom: 10 }}>Value</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {CVALS.map(v => (
          <motion.button
            key={v}
            whileTap={{ scale: 0.9 }}
            onClick={() => pickVal(v)}
            className="mono"
            style={{
              height: 46, borderRadius: 11,
              background: 'oklch(0% 0 0 / 25%)',
              border: '1px solid var(--border)',
              fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: suit ? (suit.r ? 'oklch(65% 0.19 25)' : 'var(--ink)') : 'var(--ink-3)',
              transition: 'color .15s',
            }}
          >
            {v}
          </motion.button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <Button variant="ghost" full onClick={() => { setSuit(null); onClose() }}>Cancel</Button>
      </div>
    </Modal>
  )
}
