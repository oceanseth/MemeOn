import { Link } from 'react-router-dom'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { cn } from '../lib/cn'

/* The legal template (`859-0` / `893-0`, and the same on every Terms board): a 720 measure, a
   card-title Unbounded section heading, 16/24 body on `ink`, and a `--color-line` hairline under
   each section's 22px of breathing room. */
const SECTION = 'mt-6 border-b border-line pb-[22px] last:border-b-0'
const H2 = cn(
  'm-0 font-display text-card-title font-medium tracking-card-title text-ink',
  '[scroll-margin-top:calc(var(--topbar-h)+16px)]',
)
const P = 'mt-4 mb-0 max-w-[65ch] text-body text-ink'
const A = 'text-link underline underline-offset-[3px] decoration-1 font-semibold'
/** The cross-link that closes the document: 16/24, 600, ultraviolet, underline offset 3. */
const CROSS_LINK = cn(A, 'inline-block mt-[10px]')

/* TOC chips: the control radius at a 44px minimum target. The current section wears the pressed
   well; the rest are the board's outlined chips. */
const TOC_CHIP = cn(
  'inline-flex min-h-11 items-center rounded-control px-[14px] text-small/[20px] text-ink no-underline',
  '[transition:background-color_var(--dur-base)_ease] motion-reduce:transition-none',
)
const TOC_CHIP_REST = cn(TOC_CHIP, 'border border-line hover:bg-surface-raised')
const TOC_CHIP_CURRENT = cn(TOC_CHIP, 'border-0 bg-surface-pressed shadow-pressed')

const SECTIONS = [
  { id: 'short-version', label: 'The short version' },
  { id: 'what-we-collect', label: 'What we collect' },
  { id: 'what-we-never-collect', label: 'What we never collect' },
  { id: 'where-it-lives', label: 'Where it lives' },
  { id: 'deletion', label: 'Deletion' },
  { id: 'age', label: 'Age' },
  { id: 'changes', label: 'Changes' },
] as const

/** Static privacy policy. No engine — copy only. */
export function PrivacyScreen() {
  return (
    <PageContainer as="main" id="main" tabIndex={-1} narrow className="pt-9">
      <PageHead
        level="h1"
        title="Privacy Policy"
        subtitle={
          <>
            Last updated: <time dateTime="2026-07-06">July 6, 2026</time>
          </>
        }
        className="mb-5"
      />

      <nav aria-label="On this page">
        <ul data-slot="legal-toc" className="m-0 flex list-none flex-wrap gap-2 p-0">
          {SECTIONS.map((section, index) => (
            <li key={section.id}>
              <a className={index === 0 ? TOC_CHIP_CURRENT : TOC_CHIP_REST} href={`#${section.id}`}>
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section data-slot="legal-section" className={cn(SECTION, 'mt-8')}>
        <h2 className={H2} id="short-version">The short version</h2>
        <p className={P}>MemeOn is built to know as little about you as possible.</p>
        <p className={P}>
          You sign in with Masky, which gives us a pseudonymous avatar identity —{' '}
          <strong>we never receive your real name, email address, or Masky account id</strong>.
        </p>
        <p className={P}>
          We don’t sell data, we don’t run ads, and we don’t track you across other sites.
        </p>
      </section>

      <section data-slot="legal-section" className={SECTION}>
        <h2 className={H2} id="what-we-collect">What we collect</h2>
        <ul className="mt-[10px] mb-0 list-disc pl-6">
          <li className={cn(P, 'mt-0')}>
            <strong>Avatar identity from Masky SSO:</strong> a pseudonymous id (unique to MemeOn and
            uncorrelatable with other sites), your avatar’s display name and picture. That’s the
            whole identity.
          </li>
          <li className={cn(P, 'mt-[10px]')}>
            <strong>Things you do on MemeOn:</strong> memes you mint or upload, share positions,
            listings, trades, friendships, follows, likes and passes, quest progress, braincell
            balance, and alerts. This is the product working as intended.
          </li>
          <li className={cn(P, 'mt-[10px]')}>
            <strong>Reshare counts:</strong> loads of a meme’s share link increment a counter. We
            count the event, not who loaded it.
          </li>
          <li className={cn(P, 'mt-[10px]')}>
            <strong>Online presence:</strong> while signed in, a “who’s online” flag keyed to your
            pseudonymous id (Firebase Realtime Database), visible only to signed-in users and
            removed when you disconnect.
          </li>
          <li className={cn(P, 'mt-[10px]')}>
            <strong>Discord (optional):</strong> if you run <code>/memeon-connect</code>, we store
            your Discord user id linked to your MemeOn account so search can rank your binder and
            friends first. Nothing else about your Discord account is read or stored, and the link
            is never shown to other users.
          </li>
        </ul>
      </section>

      <section data-slot="legal-section" className={SECTION}>
        <h2 className={H2} id="what-we-never-collect">What we never collect</h2>
        <p className={P}>
          Real names, email addresses, phone numbers, contacts, precise location, or payment
          details. AI generation runs on your own Masky credits — billing happens at Masky, not
          here. Braincells are play currency with no monetary value.
        </p>
      </section>

      <section data-slot="legal-section" className={SECTION}>
        <h2 className={H2} id="where-it-lives">Where it lives</h2>
        <p className={P}>
          Data is stored on Amazon Web Services (US) and Google Firebase (presence only). Sign-in
          and generation are provided by Masky (masky.ai) under their own privacy policy. Some
          archive memes embed media hosted by GIPHY, credited on the card.
        </p>
      </section>

      <section data-slot="legal-section" className={SECTION}>
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
      </section>

      <section data-slot="legal-section" className={SECTION}>
        <h2 className={H2} id="age">Age</h2>
        <p className={P}>MemeOn is not intended for children under 13.</p>
      </section>

      <section data-slot="legal-section" className={SECTION}>
        <h2 className={H2} id="changes">Changes</h2>
        <p className={P}>
          If this policy changes materially we’ll note it here with a new date. Questions:{' '}
          <a className={A} href="mailto:seth@voicecert.com?subject=MemeOn%20privacy%20question">
            seth@voicecert.com
          </a>
          .
        </p>
        <p className="m-0">
          <Link className={CROSS_LINK} to="/terms">
            Terms of Service <span aria-hidden="true">→</span>
          </Link>
        </p>
      </section>
    </PageContainer>
  )
}
