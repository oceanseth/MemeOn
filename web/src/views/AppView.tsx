import { lazy, Suspense, type ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthCallback, MobileAuthForward } from '../lib/legacyAuthPages'
import { AppShellView } from './AppShellView'
import { DiscordLinkView } from './DiscordLinkView'
import { DiscordPageView } from './DiscordPageView'
import { InviteView } from './InviteView'
import { LandingView } from './LandingView'
import { MemeDetailView } from './MemeDetailView'
import { PrivacyView } from './PrivacyView'
import { ProfileView } from './ProfileView'
import { TermsView } from './TermsView'

/* Landing, legal and the public share routes stay eager so first paint is unchanged;
   everything only a signed-in player can reach arrives with its route. */
const BinderView = lazy(() => import('./BinderView').then((m) => ({ default: m.BinderView })))
const CreateMemeView = lazy(() => import('./CreateMemeView').then((m) => ({ default: m.CreateMemeView })))
const DevelopersView = lazy(() => import('./DevelopersView').then((m) => ({ default: m.DevelopersView })))
const FriendsView = lazy(() => import('./FriendsView').then((m) => ({ default: m.FriendsView })))
const LeaderboardView = lazy(() => import('./LeaderboardView').then((m) => ({ default: m.LeaderboardView })))
const MarketplaceView = lazy(() => import('./MarketplaceView').then((m) => ({ default: m.MarketplaceView })))
const TradesView = lazy(() => import('./TradesView').then((m) => ({ default: m.TradesView })))

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
  if (user && sub === user.sub)
    return (
      <Suspense fallback={<AuthSpinner />}>
        <BinderView />
      </Suspense>
    )
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

/** A remix source is actor input, so changing it needs a fresh mint engine. */
export function CreateMemeRoute() {
  const [params] = useSearchParams()
  const remixId = params.get('remix')
  return <CreateMemeView key={remixId ?? ''} />
}

/** An inviter is actor input, so changing it needs a fresh invite engine. */
export function InviteRoute() {
  const { sub } = useParams<{ sub: string }>()
  return <InviteView key={sub} />
}

/** The one named waiting state for a guarded route: auth resolving, then the chunk arriving. */
function AuthSpinner() {
  return (
    <main className="container" id="main" tabIndex={-1}>
      <div className="loading-state" role="status">
        <span className="spin" aria-hidden="true" />
        Checking your session…
      </div>
    </main>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <AuthSpinner />
  if (!user) return <Navigate to="/" replace />
  return <Suspense fallback={<AuthSpinner />}>{children}</Suspense>
}

export const AppView = observer(function AppView() {
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
})
