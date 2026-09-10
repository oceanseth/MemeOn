import { Link } from 'react-router-dom'
import { PageContainer } from '../atoms/PageContainer'
import { cn } from '../lib/cn'

/* `my-4` restores the browser's default `<p>` margin (1em ≈ 16px) that preflight zeroes;
   `<li>` call sites cancel it back to 0 since `.legal li` never had one. */
const P = 'my-4 text-base leading-[1.65] text-text'
const H2 = 'mt-[26px] mb-2 text-[18px] font-bold [scroll-margin-top:calc(var(--topbar-h)+16px)]'
const A = 'underline underline-offset-2 decoration-1 decoration-[color-mix(in_oklab,currentColor_60%,transparent)] hover:decoration-current focus-visible:decoration-current'
const TOC_LINK = cn(
  'inline-block rounded-pill border border-border px-2.5 py-1 text-[13px] text-text-dim no-underline',
  'hover:border-accent hover:text-text focus-visible:border-accent focus-visible:text-text',
  'pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center',
)

/** Static privacy policy. No engine — copy only. */
export function PrivacyScreen() {
  return (
    <PageContainer as="main" id="main" tabIndex={-1} className="max-w-[68ch] pt-9">
      <h1 className="mb-1 font-bold">Privacy Policy</h1>
      <p className="mb-[26px] text-[13px] text-text-dim">
        Last updated: <time dateTime="2026-07-06">July 6, 2026</time>
      </p>

      <nav aria-label="On this page">
        <ul className="m-0 mb-[26px] flex list-none flex-wrap gap-2 p-0">
          <li>
            <a className={TOC_LINK} href="#short-version">The short version</a>
          </li>
          <li>
            <a className={TOC_LINK} href="#what-we-collect">What we collect</a>
          </li>
          <li>
            <a className={TOC_LINK} href="#what-we-never-collect">What we never collect</a>
          </li>
          <li>
            <a className={TOC_LINK} href="#where-it-lives">Where it lives</a>
          </li>
          <li>
            <a className={TOC_LINK} href="#deletion">Deletion</a>
          </li>
          <li>
            <a className={TOC_LINK} href="#age">Age</a>
          </li>
          <li>
            <a className={TOC_LINK} href="#changes">Changes</a>
          </li>
        </ul>
      </nav>

      <h2 className={H2} id="short-version">The short version</h2>
      <p className={P}>MemeOn is built to know as little about you as possible.</p>
      <p className={cn(P, 'border-l-2 border-gold pl-3')}>
        You sign in with Masky, which gives us a pseudonymous avatar identity —{' '}
        <strong>we never receive your real name, email address, or Masky account id</strong>.
      </p>
      <p className={P}>
        We don’t sell data, we don’t run ads, and we don’t track you across other sites.
      </p>

      <h2 className={H2} id="what-we-collect">What we collect</h2>
      <ul className="my-4 list-disc pl-10">
        <li className={cn(P, 'mt-0 mb-0')}>
          <strong>Avatar identity from Masky SSO:</strong> a pseudonymous id (unique to MemeOn and
          uncorrelatable with other sites), your avatar’s display name and picture. That’s the
          whole identity.
        </li>
        <li className={cn(P, 'mt-0 mb-0')}>
          <strong>Things you do on MemeOn:</strong> memes you mint or upload, share positions,
          listings, trades, friendships, follows, likes and passes, quest progress, braincell
          balance, and alerts. This is the product working as intended.
        </li>
        <li className={cn(P, 'mt-0 mb-0')}>
          <strong>Reshare counts:</strong> loads of a meme’s share link increment a counter. We
          count the event, not who loaded it.
        </li>
        <li className={cn(P, 'mt-0 mb-0')}>
          <strong>Online presence:</strong> while signed in, a “who’s online” flag keyed to your
          pseudonymous id (Firebase Realtime Database), visible only to signed-in users and
          removed when you disconnect.
        </li>
        <li className={cn(P, 'mt-0 mb-0')}>
          <strong>Discord (optional):</strong> if you run <code>/memeon-connect</code>, we store
          your Discord user id linked to your MemeOn account so search can rank your binder and
          friends first. Nothing else about your Discord account is read or stored, and the link
          is never shown to other users.
        </li>
      </ul>

      <h2 className={H2} id="what-we-never-collect">What we never collect</h2>
      <p className={P}>
        Real names, email addresses, phone numbers, contacts, precise location, or payment
        details. AI generation runs on your own Masky credits — billing happens at Masky, not
        here. Braincells are play currency with no monetary value.
      </p>

      <h2 className={H2} id="where-it-lives">Where it lives</h2>
      <p className={P}>
        Data is stored on Amazon Web Services (US) and Google Firebase (presence only). Sign-in
        and generation are provided by Masky (masky.ai) under their own privacy policy. Some
        archive memes embed media hosted by GIPHY, credited on the card.
      </p>

      <h2 className={H2} id="deletion">Deletion</h2>
      <p className={P}>
        Sole owners can <Link className={A} to="/binder">make any meme private</Link> (removing it from all
        public surfaces). To delete your account and its data, email{' '}
        <a className={A} href="mailto:seth@voicecert.com?subject=MemeOn%20account%20deletion">
          seth@voicecert.com
        </a>{' '}
        from a message linked to your avatar identity and we’ll remove it within 30 days. Revoking
        MemeOn’s access from your Masky account (
        <a className={A} href="https://masky.ai/developer" target="_blank" rel="noopener noreferrer">
          masky.ai/developer → Connected apps
        </a>
        ) ends our ability to act on your behalf immediately.
      </p>

      <h2 className={H2} id="age">Age</h2>
      <p className={P}>MemeOn is not intended for children under 13.</p>

      <h2 className={H2} id="changes">Changes</h2>
      <p className={P}>
        If this policy changes materially we’ll note it here with a new date. Questions:{' '}
        <a className={A} href="mailto:seth@voicecert.com?subject=MemeOn%20privacy%20question">
          seth@voicecert.com
        </a>
        .
      </p>
      <p className={cn(P, 'mt-8 border-t border-border pt-4')}>
        See also: <Link className={A} to="/terms">Terms of Service</Link>.
      </p>
    </PageContainer>
  )
}
