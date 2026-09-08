import type { ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthCallback, MobileAuthForward } from '../lib/legacyAuthPages'
import { AppShellView } from './AppShellView'
import { BinderView } from './BinderView'
import { CreateMemeView } from './CreateMemeView'
import { DevelopersView } from './DevelopersView'
import { DiscordLinkView } from './DiscordLinkView'
import { DiscordPageView } from './DiscordPageView'
import { FriendsView } from './FriendsView'
import { InviteView } from './InviteView'
import { LandingView } from './LandingView'
import { LeaderboardView } from './LeaderboardView'
import { MarketplaceView } from './MarketplaceView'
import { MemeDetailView } from './MemeDetailView'
import { PrivacyView } from './PrivacyView'
import { ProfileView } from './ProfileView'
import { TermsView } from './TermsView'
import { TradesView } from './TradesView'

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

/** Fresh machine per meme id so remix/cap-table links do not reuse the previous actor. */
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

export const AppView = observer(function AppView() {
  return (
    <AppShellView>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/mobile" element={<MobileAuthForward />} />
        <Route path="/invite/:sub" element={<InviteView />} />
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
              <CreateMemeView />
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
})
