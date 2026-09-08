import { Navigate, Route, Routes, useParams } from 'react-router-dom'

function LegacyMemeRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/m/${id}`} replace />
}

/** Bare /binder → the caller's own shareable /binder/:sub URL. */
function BinderOwnRedirect() {
  const { user } = useAuth()
  return <Navigate to={`/binder/${encodeURIComponent(user!.sub)}`} replace />
}

/** /binder/:sub — owner gets the management binder; anyone else gets the public profile binder. */
function BinderRoute() {
  const { sub } = useParams<{ sub: string }>()
  const { user } = useAuth()
  if (user && sub === user.sub) return <Binder />
  return <Profile initialTab="binder" />
}
import { Layout } from './components/Layout'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import AuthCallback from './pages/AuthCallback'
import MobileAuthForward from './pages/MobileAuthForward'
import Invite from './pages/Invite'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import DiscordPage from './pages/DiscordPage'
import DiscordLink from './pages/DiscordLink'
import Privacy from './pages/Privacy'
import Developers from './pages/Developers'
import Terms from './pages/Terms'
import Marketplace from './pages/Marketplace'
import Binder from './pages/Binder'
import { CreateMemeView } from './views/CreateMemeView'
import Friends from './pages/Friends'
import Trades from './pages/Trades'
import MemeDetail from './pages/MemeDetail'
import type { ReactNode } from 'react'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <span className="spin" />
      </div>
    )
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/mobile" element={<MobileAuthForward />} />
        <Route path="/invite/:sub" element={<Invite />} />
        <Route path="/discord" element={<DiscordPage />} />
        <Route path="/discord/link" element={<DiscordLink />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route
          path="/developers"
          element={
            <RequireAuth>
              <Developers />
            </RequireAuth>
          }
        />
        <Route path="/terms" element={<Terms />} />
        <Route
          path="/marketplace"
          element={
            <RequireAuth>
              <Marketplace />
            </RequireAuth>
          }
        />
        <Route
          path="/binder"
          element={
            <RequireAuth>
              <BinderOwnRedirect />
            </RequireAuth>
          }
        />
        {/* public: shared binder links must work for logged-out visitors */}
        <Route path="/binder/:sub" element={<BinderRoute />} />
        <Route
          path="/binder/new"
          element={
            <RequireAuth>
              <CreateMemeView />
            </RequireAuth>
          }
        />
        <Route
          path="/friends"
          element={
            <RequireAuth>
              <Friends />
            </RequireAuth>
          }
        />
        <Route
          path="/trade"
          element={
            <RequireAuth>
              <Trades />
            </RequireAuth>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <RequireAuth>
              <Leaderboard />
            </RequireAuth>
          }
        />
        {/* public: profile links unfurl with og cards, so they must load logged-out too */}
        <Route path="/u/:sub" element={<Profile />} />
        {/* /m/ is the one true meme URL; legacy /meme/ links redirect into it */}
        <Route path="/m/:id" element={<MemeDetail />} />
        <Route path="/meme/:id" element={<LegacyMemeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
