import { calcSettle, playerName } from '../lib/utils'
import type { Player } from '../lib/types'

interface SettlementProps {
  results: Record<string, number>
  players: Player[]
  households: [string, string][]
}

export function Settlement({ results, players, households }: SettlementProps) {
  const res = calcSettle(results, players, households)

  const name = (id: string) => playerName(id, players)

  const internalLines = res.households.filter(x => x.internal && x.internal.amount > 0)

  if (!res.txns.length && !internalLines.length) {
    return (
      <div style={{
        background: 'var(--green-dim)', border: '1px solid rgba(0,232,122,.25)',
        borderRadius: 12, padding: '10px', textAlign: 'center',
        color: 'var(--green)', fontSize: 13, marginTop: 8, fontWeight: 500,
      }}>
        ✓ All square — no payments needed
      </div>
    )
  }

  return (
    <div>
      {internalLines.length > 0 && (
        <>
          <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', margin: '12px 0 7px', fontWeight: 600 }}>
            🏠 Household Internal (no cash)
          </div>
          {internalLines.map((hh, i) => (
            <TxnRow key={i}
              from={name(hh.internal!.from)}
              to={name(hh.internal!.to)}
              amount={hh.internal!.amount}
              dim
            />
          ))}
        </>
      )}

      {Math.abs(res.imbalance) >= 1 && (
        <div style={{
          background: 'rgba(255,51,85,.1)', border: '1px solid rgba(255,51,85,.3)',
          borderRadius: 10, padding: '10px 12px', marginTop: 10,
          fontSize: 12, color: 'var(--red)', lineHeight: 1.5,
        }}>
          ⚠️ <strong>Settlement off by Rs.{Math.abs(res.imbalance).toLocaleString('en-IN')}</strong>. Cashouts don't balance against buyins.
        </div>
      )}

      {res.txns.length > 0 && (
        <>
          <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--t3)', margin: '12px 0 7px', fontWeight: 600 }}>
            Who Pays Who
          </div>
          {res.txns.map((t, i) => (
            <TxnRow key={i} from={name(t.from)} to={name(t.to)} amount={t.amount} />
          ))}
        </>
      )}
    </div>
  )
}

function TxnRow({ from, to, amount, dim }: { from: string; to: string; amount: number; dim?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(0,0,0,.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 6,
      opacity: dim ? 0.8 : 1,
    }}>
      <span>
        <span style={{ color: 'var(--red)', fontWeight: 700 }}>{from}</span>
        <span style={{ color: 'var(--t3)', margin: '0 7px' }}>→</span>
        <span style={{ color: 'var(--green)', fontWeight: 700 }}>{to}</span>
      </span>
      <span style={{ color: 'var(--gold)', fontWeight: 700, fontStyle: dim ? 'italic' : 'normal' }}>
        Rs.{amount.toLocaleString('en-IN')}
      </span>
    </div>
  )
}
