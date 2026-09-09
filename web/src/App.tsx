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
import { useAuth } from './context/AuthContext'
import AuthCallback from './pages/AuthCallback'
import MobileAuthForward from './pages/MobileAuthForward'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import Marketplace from './pages/Marketplace'
import Binder from './pages/Binder'
import CreateMeme from './pages/CreateMeme'
import Friends from './pages/Friends'
import Trades from './pages/Trades'
import MemeDetail from './pages/MemeDetail'
import type { ReactNode } from 'react'
import { AppShellView } from './views/AppShellView'
import { DevelopersView } from './views/DevelopersView'
import { DiscordLinkView } from './views/DiscordLinkView'
import { DiscordPageView } from './views/DiscordPageView'
import { InviteView } from './views/InviteView'
import { LandingView } from './views/LandingView'
import { PrivacyView } from './views/PrivacyView'
import { TermsView } from './views/TermsView'

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

function InviteRoute() {
  const { sub } = useParams<{ sub: string }>()
  return <InviteView key={sub} />
}

export default function App() {
  return (
    <AppShellView>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/mobile" element={<MobileAuthForward />} />
        <Route path="/invite/:sub" element={<InviteRoute />} />
        <Route path="/discord" element={<DiscordPageView />} />
        <Route path="/discord/link" element={<DiscordLinkView />} />
        <Route path="/privacy" element={<PrivacyView />} />
        <Route
          path="/developers"
          element={
            <RequireAuth>
              <DevelopersView />
            </RequireAuth>
          }
        />
        <Route path="/terms" element={<TermsView />} />
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
              <CreateMeme />
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
    </AppShellView>
  )
}
