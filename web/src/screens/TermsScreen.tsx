import { Link } from 'react-router-dom'
import { PageContainer } from '../atoms/PageContainer'
import { cn } from '../lib/cn'

/* `my-4` restores the browser's default `<p>` margin (1em ≈ 16px) that preflight zeroes. */
const P = 'my-4 text-base leading-[1.65] text-text'
const H2 = 'mt-[26px] mb-2 text-[18px] font-bold [scroll-margin-top:calc(var(--topbar-h)+16px)]'
const A = 'underline underline-offset-2 decoration-1 decoration-[color-mix(in_oklab,currentColor_60%,transparent)] hover:decoration-current focus-visible:decoration-current'
const TOC_LINK = cn(
  'inline-block rounded-pill border border-border px-2.5 py-1 text-[13px] text-text-dim no-underline',
  'hover:border-accent hover:text-text focus-visible:border-accent focus-visible:text-text',
  'pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center',
)

/** Static terms of service. No engine — copy only. */
export function TermsScreen() {
  return (
    <PageContainer as="main" id="main" tabIndex={-1} className="max-w-[68ch] pt-9">
      <h1 className="mb-1 font-bold">Terms of Service</h1>
      <p className="mb-[26px] text-[13px] text-text-dim">
        Last updated: <time dateTime="2026-07-06">July 6, 2026</time>
      </p>

      <nav aria-label="On this page">
        <ul className="m-0 mb-[26px] flex list-none flex-wrap gap-2 p-0">
          <li>
            <a className={TOC_LINK} href="#what-memeon-is">What MemeOn is</a>
          </li>
          <li>
            <a className={TOC_LINK} href="#your-account">Your account</a>
          </li>
          <li>
            <a className={TOC_LINK} href="#your-content">Your content</a>
          </li>
          <li>
            <a className={TOC_LINK} href="#claims-and-takedowns">Claims and takedowns</a>
          </li>
          <li>
            <a className={TOC_LINK} href="#the-market-is-a-game">The market is a game</a>
          </li>
          <li>
            <a className={TOC_LINK} href="#third-party-services">Third-party services</a>
          </li>
          <li>
            <a className={TOC_LINK} href="#no-warranty">No warranty</a>
          </li>
          <li>
            <a className={TOC_LINK} href="#contact">Contact</a>
          </li>
        </ul>
      </nav>

      <h2 className={H2} id="what-memeon-is">What MemeOn is</h2>
      <p className={P}>
        MemeOn is an entertainment product: memes become collectible cards whose rarity tiers
        follow real reshares, and users trade positions in them using braincells.
      </p>
      <p className={cn(P, 'border-l-2 border-gold pl-3')}>
        <strong>Braincells are a play currency with no monetary value.</strong>
      </p>
      <p className={P}>
        They cannot be purchased, sold, redeemed, or exchanged for money or anything of value.
        Nothing on MemeOn is an investment, security, or financial product, and card “values” are
        game mechanics, not prices.
      </p>

      <h2 className={H2} id="your-account">Your account</h2>
      <p className={P}>
        You sign in through Masky and are responsible for activity under your avatar. You must be
        13 or older. We may suspend accounts that abuse the service (spam minting, reshare
        manipulation, harassment, or attempts to exploit the economy).
      </p>

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

      <h2 className={H2} id="the-market-is-a-game">The market is a game</h2>
      <p className={P}>
        We may adjust braincell rewards, tier thresholds, card values, quests, and other economy
        mechanics at any time to keep the game fun and fair.
      </p>
      <p className={cn(P, 'border-l-2 border-gold pl-3')}>
        <strong>Trades and purchases are final.</strong>
      </p>
      <p className={P}>
        Reshare counts reflect link loads, including automated ones — that’s the mechanic, not a
        bug.
      </p>

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

      <h2 className={H2} id="no-warranty">No warranty</h2>
      <p className={P}>
        MemeOn is provided as-is, without warranties. To the maximum extent permitted by law, our
        liability is limited to the amount you paid us to use MemeOn, which is zero.
      </p>

      <h2 className={H2} id="contact">Contact</h2>
      <p className={P}>
        <a className={A} href="mailto:seth@voicecert.com?subject=MemeOn%20terms%20question">
          seth@voicecert.com
        </a>
      </p>
      <p className={cn(P, 'mt-8 border-t border-border pt-4')}>
        See also: <Link className={A} to="/privacy">Privacy Policy</Link>.
      </p>
    </PageContainer>
  )
}
