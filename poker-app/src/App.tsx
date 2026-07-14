import { useEffect, useState } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { useStore } from './store'
import { initSounds } from './lib/sounds'

import { Setup } from './pages/Setup'
import { Dashboard } from './pages/Dashboard'
import { Live } from './pages/Live'
import { Leaderboard } from './pages/Leaderboard'
import { Players } from './pages/Players'
import { Settings } from './pages/Settings'

import { Header } from './components/Header'
import { BottomNav } from './components/BottomNav'
import { ToastContainer } from './components/Toast'
import { StartSessionModal } from './components/StartSessionModal'
import { CardPickerModal } from './components/CardPickerModal'
import { CashoutModal } from './components/CashoutModal'

export default function App() {
  const fbConfig = useStore(s => s.fbConfig)
  const initApp = useStore(s => s.initApp)
  const tab = useStore(s => s.tab)
  const setTab = useStore(s => s.setTab)
  const setApiKey = useStore(s => s.setApiKey)
  const activeSessId = useStore(s => s.activeSessId)
  const sessions = useStore(s => s.sessions)
  const setLiveBuyin = useStore(s => s.setLiveBuyin)

  const [ready, setReady] = useState(false)
  const [showStart, setShowStart] = useState(false)
  const [cardTarget, setCardTarget] = useState<string | null>(null)
  const [cashoutSessId, setCashoutSessId] = useState<string | null>(null)

  // Initialize from stored config on mount
  useEffect(() => {
    if (fbConfig) {
      initApp(fbConfig).then(() => setReady(true))
    } else {
      setReady(true)
    }
    initSounds()
  }, [])

  const handleConnect = async (config: Record<string, string>, aiKey: string) => {
    if (aiKey) setApiKey(aiKey)
    await initApp(config)
    setReady(true)
  }

  // Setup screen
  if (!fbConfig || !ready) {
    return (
      <MotionConfig reducedMotion="user">
        <Setup onConnect={handleConnect} />
        <ToastContainer />
      </MotionConfig>
    )
  }

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -6 },
  }

  const openCashout = (sessId: string) => {
    // Set live buyins from session if needed
    const sess = sessions.find(s => s.id === sessId)
    if (sess && sessId !== activeSessId) {
      // For non-active sessions (ended early from sessions tab)
      Object.entries(sess.buyins || {}).forEach(([id, cnt]) => setLiveBuyin(id, cnt))
    }
    setCashoutSessId(sessId)
  }

  return (
    <MotionConfig reducedMotion="user">
      <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh' }}>
        <Header onNewSession={() => setShowStart(true)} />

        <div style={{ paddingBottom: 90 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {tab === 'dashboard'   && <Dashboard onGoLive={() => setTab('live')} />}
              {tab === 'live'        && (
                <Live
                  onEndSession={() => activeSessId && openCashout(activeSessId)}
                  onCardPick={target => setCardTarget(target)}

                />
              )}
              {tab === 'leaderboard' && <Leaderboard />}
              {tab === 'players'     && <Players />}
              {tab === 'settings'    && <Settings />}
            </motion.div>
          </AnimatePresence>
        </div>

        <BottomNav />
      </div>

      <StartSessionModal open={showStart} onClose={() => setShowStart(false)} />
      <CardPickerModal open={!!cardTarget} target={cardTarget} onClose={() => setCardTarget(null)} />
      <CashoutModal open={!!cashoutSessId} onClose={() => setCashoutSessId(null)} forceSessId={cashoutSessId} />
      <ToastContainer />
    </MotionConfig>
  )
}
