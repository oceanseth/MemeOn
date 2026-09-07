import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { AlertsBell } from '../molecules/AlertsBell'
import { QuestBar } from '../molecules/QuestBar'
import { AppShell } from '../organisms/AppShell'
import type { Alert, Meme, QuestStep } from '../lib/types'

const POLL_MS = 30_000

/** Legacy chrome adapter: owns fetch + open state until the chrome screen exists. */
export function Layout({ children }: { children: ReactNode }) {
  const { user, logout, refresh } = useAuth()
  const navigate = useNavigate()

  const [steps, setSteps] = useState<QuestStep[] | null>(null)
  const [packMemes, setPackMemes] = useState<Meme[] | null>(null)
  const [packReward, setPackReward] = useState(0)
  const [packBusy, setPackBusy] = useState(false)

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertsOpen, setAlertsOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const allDone = user && user.onboarding && ['pack', 'mint', 'share', 'friend', 'trade'].every(
    (k) => user.onboarding?.[k as keyof typeof user.onboarding],
  )

  useEffect(() => {
    if (!user || allDone) return
    apiFetch<{ steps: QuestStep[] }>('/api/onboarding')
      .then((r) => setSteps(r.steps))
      .catch(() => {})
  }, [user, allDone])

  useEffect(() => {
    if (!user) return
    let live = true
    const load = () =>
      apiFetch<{ alerts: Alert[] }>('/api/alerts')
        .then((r) => live && setAlerts(r.alerts))
        .catch(() => {})
    void load()
    const t = setInterval(load, POLL_MS)
    return () => {
      live = false
      clearInterval(t)
    }
  }, [user])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!bellRef.current?.contains(e.target as Node)) setAlertsOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const claimPack = async () => {
    setPackBusy(true)
    try {
      const out = await post<{ memes: Meme[]; reward: number }>('/api/onboarding/claim-pack', {})
      setPackMemes(out.memes)
      setPackReward(out.reward)
      setSteps((prev) => prev?.map((s) => (s.key === 'pack' ? { ...s, done: true } : s)) ?? null)
      void refresh()
    } catch {
      /* already claimed */
    } finally {
      setPackBusy(false)
    }
  }

  const openAlerts = async (next: boolean) => {
    setAlertsOpen(next)
    const unread = alerts.filter((a) => !a.read)
    if (next && unread.length > 0) {
      await post('/api/alerts/read', { ids: unread.map((a) => a.id) }).catch(() => {})
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
      void refresh()
    }
  }

  const nav = user ? (
    <nav className="nav-links">
      <NavLink to="/marketplace">Marketplace</NavLink>
      <NavLink to="/binder">My Binder</NavLink>
      <NavLink to="/friends">Friends</NavLink>
      <NavLink to="/trade">Trade</NavLink>
      <NavLink to="/leaderboard">🏆 Top Brains</NavLink>
    </nav>
  ) : undefined

  const toolbar = user ? (
    <>
      <span className="coins" title="Braincells">
        🧠 {user.coins.toLocaleString()}
      </span>
      <AlertsBell alerts={alerts} open={alertsOpen} onOpenChange={openAlerts} rootRef={bellRef} />
      {user.picture && (
        <Link to={`/u/${encodeURIComponent(user.sub)}`}>
          <img className="avatar" src={user.picture} alt={user.name} />
        </Link>
      )}
      <button
        onClick={() => {
          logout()
          navigate('/')
        }}
      >
        Log out
      </button>
    </>
  ) : undefined

  const showQuest = user && !allDone && steps
  const quest = showQuest || packMemes ? (
    <QuestBar
      steps={steps ?? []}
      packMemes={packMemes}
      packReward={packReward}
      busy={packBusy}
      onClaimPack={claimPack}
      onDismissPack={() => setPackMemes(null)}
    />
  ) : undefined

  return (
    <AppShell nav={nav} toolbar={toolbar} quest={quest}>
      {children}
    </AppShell>
  )
}
