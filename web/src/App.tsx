import { Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom'

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
  if (user && sub === user.sub) return <BinderView />
  return <ProfileView key={sub} initialTab="binder" />
}

function ProfileRoute() {
  const { sub } = useParams<{ sub: string }>()
  return <ProfileView key={sub} />
}
import { useAuth } from './context/AuthContext'
import AuthCallback from './pages/AuthCallback'
import MobileAuthForward from './pages/MobileAuthForward'
import type { ReactNode } from 'react'
import { AppShellView } from './views/AppShellView'
import { CreateMemeView } from './views/CreateMemeView'
import { DevelopersView } from './views/DevelopersView'
import { DiscordLinkView } from './views/DiscordLinkView'
import { DiscordPageView } from './views/DiscordPageView'
import { InviteView } from './views/InviteView'
import { LandingView } from './views/LandingView'
import { PrivacyView } from './views/PrivacyView'
import { TermsView } from './views/TermsView'
import { MarketplaceView } from './views/MarketplaceView'
import { MemeDetailView } from './views/MemeDetailView'
import { TradesView } from './views/TradesView'
import { BinderView } from './views/BinderView'
import { ProfileView } from './views/ProfileView'
import { FriendsView } from './views/FriendsView'
import { LeaderboardView } from './views/LeaderboardView'

/** Fresh machine per meme id so links do not reuse the previous detail actor. */
function MemeDetailRoute() {
  const { id } = useParams<{ id: string }>()
  return <MemeDetailView key={id} />
}

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

/** A remix source is route input, so changing it needs a fresh mint engine. */
export function CreateMemeRoute() {
  const [params] = useSearchParams()
  const remixId = params.get('remix')
  return <CreateMemeView key={remixId ?? ''} />
}

export function InviteRoute() {
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
              <MarketplaceView />
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
              <CreateMemeRoute />
            </RequireAuth>
          }
        />
        <Route
          path="/friends"
          element={
            <RequireAuth>
              <FriendsView />
            </RequireAuth>
          }
        />
        <Route
          path="/trade"
          element={
            <RequireAuth>
              <TradesView />
            </RequireAuth>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <RequireAuth>
              <LeaderboardView />
            </RequireAuth>
          }
        />
        {/* public: profile links unfurl with og cards, so they must load logged-out too */}
        <Route path="/u/:sub" element={<ProfileRoute />} />
        {/* /m/ is the one true meme URL; legacy /meme/ links redirect into it */}
        <Route path="/m/:id" element={<MemeDetailRoute />} />
        <Route path="/meme/:id" element={<LegacyMemeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShellView>
  )
}
