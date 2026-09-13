import { Link } from 'react-router-dom'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { cn } from '../lib/cn'

/** Legal page layout: 720 measure, section hairlines. */
const SECTION = 'mt-6 border-b border-line pb-5.5 last:border-b-0'
const H2 = cn(
  'm-0 font-display text-card-title font-medium tracking-card-title text-ink',
  '[scroll-margin-top:calc(var(--topbar-h)+16px)]',
)
const P = 'mt-4 mb-0 max-w-measure text-body text-ink'
const A = 'text-link underline underline-offset-[3px] decoration-1 font-semibold'
/** The cross-link that closes the document: 16/24, 600, ultraviolet, underline offset 3. */
const CROSS_LINK = cn(A, 'inline-block mt-2.5')

const TOC_CHIP = cn(
  'inline-flex min-h-11 items-center rounded-control px-3.5 text-small/[20px] text-ink no-underline',
  '[transition:background-color_var(--dur-base)_ease] motion-reduce:transition-none',
)
const TOC_CHIP_REST = cn(TOC_CHIP, 'border border-line hover:bg-surface-raised')
const TOC_CHIP_CURRENT = cn(TOC_CHIP, 'border-0 bg-surface-pressed shadow-pressed')

const SECTIONS = [
  { id: 'what-memeon-is', label: 'What MemeOn is' },
  { id: 'your-account', label: 'Your account' },
  { id: 'your-content', label: 'Your content' },
  { id: 'claims-and-takedowns', label: 'Claims and takedowns' },
  { id: 'the-market-is-a-game', label: 'The market is a game' },
  { id: 'third-party-services', label: 'Third-party services' },
  { id: 'no-warranty', label: 'No warranty' },
  { id: 'contact', label: 'Contact' },
] as const

/** Static terms of service. No engine — copy only. */
export function TermsScreen() {
  return (
    <PageContainer as="main" id="main" tabIndex={-1} narrow className="pt-9">
      <PageHead
        level="h1"
        title="Terms of Service"
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
        <h2 className={H2} id="what-memeon-is">What MemeOn is</h2>
        <p className={P}>
          MemeOn is an entertainment product: memes become collectible cards whose rarity tiers
          follow real reshares, and users trade positions in them using braincells.
        </p>
        <p className={P}>
          <strong>Braincells are a play currency with no monetary value.</strong>
        </p>
        <p className={P}>
          They cannot be purchased, sold, redeemed, or exchanged for money or anything of value.
          Nothing on MemeOn is an investment, security, or financial product, and card “values” are
          game mechanics, not prices.
        </p>
      </section>

      <section data-slot="legal-section" className={SECTION}>
        <h2 className={H2} id="your-account">Your account</h2>
        <p className={P}>
          You sign in through Masky and are responsible for activity under your avatar. You must be
          13 or older. We may suspend accounts that abuse the service (spam minting, reshare
          manipulation, harassment, or attempts to exploit the economy).
        </p>
      </section>

      <section data-slot="legal-section" className={SECTION}>
        <h2 className={H2} id="your-content">Your content</h2>
        <p className={P}>
          You keep whatever rights you hold in memes you mint or upload, and you grant MemeOn a
          license to host, display, resize, and composite them (including into share-card images)
          to operate the service. Only mint content you have the right to use. Memes generated
          through Masky are also subject to{' '}
          <a className={A} href="https://masky.ai" target="_blank" rel="noopener noreferrer">
            Masky’s terms
          </a>
          .
        </p>
      </section>

      <section data-slot="legal-section" className={SECTION}>
        <h2 className={H2} id="claims-and-takedowns">Claims and takedowns</h2>
        <p className={P}>
          Archive memes can be claimed by their original creators through{' '}
          <Link className={A} to="/marketplace">the in-app claim flow</Link>. If content on MemeOn infringes your
          rights, email{' '}
          <a className={A} href="mailto:seth@voicecert.com?subject=MemeOn%20takedown%20request">
            seth@voicecert.com
          </a>{' '}
          with the meme link and the basis of your claim, and we’ll review and remove or transfer it
          as appropriate.
        </p>
      </section>

      <section data-slot="legal-section" className={SECTION}>
        <h2 className={H2} id="the-market-is-a-game">The market is a game</h2>
        <p className={P}>
          We may adjust braincell rewards, tier thresholds, card values, quests, and other economy
          mechanics at any time to keep the game fun and fair.
        </p>
        <p className={P}>
          <strong>Trades and purchases are final.</strong>
        </p>
        <p className={P}>
          Reshare counts reflect link loads, including automated ones — that’s the mechanic, not a
          bug.
        </p>
      </section>

      <section data-slot="legal-section" className={SECTION}>
        <h2 className={H2} id="third-party-services">Third-party services</h2>
        <p className={P}>
          Sign-in and AI generation are provided by Masky under{' '}
          <a className={A} href="https://masky.ai" target="_blank" rel="noopener noreferrer">
            their terms
          </a>
          ; generation spends your Masky credits. The Discord integration is subject to{' '}
          <a className={A} href="https://discord.com/terms" target="_blank" rel="noopener noreferrer">
            Discord’s terms
          </a>
          . Some archive media is served by{' '}
          <a className={A} href="https://giphy.com" target="_blank" rel="noopener noreferrer">
            GIPHY
          </a>{' '}
          with attribution.
        </p>
      </section>

      <section data-slot="legal-section" className={SECTION}>
        <h2 className={H2} id="no-warranty">No warranty</h2>
        <p className={P}>
          MemeOn is provided as-is, without warranties. To the maximum extent permitted by law, our
          liability is limited to the amount you paid us to use MemeOn, which is zero.
        </p>
      </section>

      <section data-slot="legal-section" className={SECTION}>
        <h2 className={H2} id="contact">Contact</h2>
        <p className={P}>
          <a className={A} href="mailto:seth@voicecert.com?subject=MemeOn%20terms%20question">
            seth@voicecert.com
          </a>
        </p>
        <p className="m-0">
          <Link className={CROSS_LINK} to="/privacy">
            Privacy Policy <span aria-hidden="true">→</span>
          </Link>
        </p>
      </section>
    </PageContainer>
  )
}
