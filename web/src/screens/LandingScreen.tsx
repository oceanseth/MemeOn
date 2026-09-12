import { Link } from 'react-router-dom'
import { Button, buttonClasses } from '../atoms/Button'
import { tierFrameClasses } from '../atoms/foil'
/* the foil sheet, imported directly (not by way of `atoms/MemeCard`'s side effect): this screen
   assembles the hero pile and the tier ladder from its own markup, on the dependency-free half of
   the seam */
import '../atoms/foil.css'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { TierChip } from '../atoms/TierChip'
import { cn } from '../lib/cn'
import type { LandingScreenModel } from '../hooks/useLandingScreen'
import { FaqItem } from '../molecules/FaqItem'
import './LandingScreen.css'

/* The board's marketing steps sit above the shared type ladder (44/55 → 23/29), so the landing
   letters them itself: 34/42 for the story heading, 32/40 for the ladder, 29/36 for the FAQ. Every
   one is Unbounded at the display weight on the title tracking, which is what the ladder gives. */
const DISPLAY = 'font-display font-medium tracking-title text-ink'
const SECTION_TITLE = cn(DISPLAY, 'm-0 text-[28px]/[35px] md:text-[34px]/[42px]')
const LADDER_TITLE = cn(DISPLAY, 'm-0 text-[27px]/[34px] md:text-[32px]/[40px]')
const SECTION = 'mt-14 max-md:mt-10'

/* The board's closing CTA is the one ultraviolet plate on the page, with the single bubblegum
   pill inside it — the ladder card and the how-it-works card are the quiet raised surfaces. */
const CARD = 'rounded-card border-0 bg-surface p-[18px] shadow-raised'

/* One tilted card of the hero pile. Positions are percentages of the pile's own box, so the whole
   arrangement scales with the column instead of needing a phone transform (the board's iPhone pile
   is the desktop one at ~0.85). `origin-top-left` matches the board's rotation origin. */
const PILE_CARD = 'absolute origin-top-left rounded-card bg-surface p-[7px] shadow-raised'

/* left/top/width as fractions of the pile's own box (`KZF-0` measured at 405×281), rotation as the
   board draws it. Percentages, so nothing needs a phone transform. */
const PILE_LAYOUT = [
  'left-0 top-[19%] w-[38.2%]',
  'left-[26.3%] top-0 w-[41.8%] rotate-[-8deg]',
  'left-[55.9%] top-[23.3%] w-[35.4%] rotate-[10deg]',
] as const

/** The board's three steps (`DSM-0`, `DSR-0`, `DSW-0`), emoji-free by design. */
const HOW_IT_WORKS = [
  { step: '01', title: 'Mint a moment', body: 'Turn an image, video, Giphy, or URL into a card.' },
  { step: '02', title: 'Drop the link', body: 'Every share unfurls with its live foil frame.' },
  { step: '03', title: 'Go ✨Shiny✨', body: 'Reshares push Paper cards up the virality tiers.' },
] as const

/** Landing as a function of its model. Every engine state is one set of args. */
export function LandingScreen({
  err,
  showMarketplaceCta,
  showLoginButton,
  showErr,
  loginLabel,
  closingLine,
  closingLoginLabel,
  heroCards,
  tiers,
  loginButtonProps,
  closingLoginButtonProps,
  frameImageProps,
  frameSlotProps,
  errorNoticeProps,
}: LandingScreenModel) {
  const marketplaceCta = (
    <Link className={buttonClasses('login')} to="/marketplace">
      🃏 Enter the marketplace
    </Link>
  )

  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      {/* Hero band (board `DRL-0`): the one raised plate the page opens on, bled into the
          container's own 20px gutter only — never across the shell's sidebar gap. */}
      <section
        data-slot="landing-hero"
        className="-mx-5 border-b border-line bg-surface-raised px-5 pt-12 pb-14 max-md:pt-8 max-md:pb-10"
      >
        <div className="grid items-center gap-12 max-md:gap-8 lg:grid-cols-[minmax(0,570px)_minmax(0,405px)] lg:justify-between">
          <div className="min-w-0">
            <h1
              className={cn(
                DISPLAY,
                'm-0 text-[42px]/[1.05] text-balance md:text-[48px]/[0.95]',
              )}
            >
              Memes are the new trading cards
            </h1>
            <p className="mt-5 mb-0 max-w-[570px] text-pretty text-body text-ink-muted md:text-[18px]/[22px]">
              Mint the moment. Watch it spread. Trade the cards everyone sends each other anyway —
              every meme gets a share link whose foil frame levels up as it travels.
            </p>
            {showMarketplaceCta ? (
              <div className="mt-7">{marketplaceCta}</div>
            ) : showLoginButton ? (
              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <Button variant="login" {...loginButtonProps}>
                  {loginLabel}
                </Button>
                <p className="m-0 max-w-[24ch] text-small text-ink-muted">
                  No email. No real name. Just your Masky avatar.
                </p>
              </div>
            ) : null}
            {showErr && (
              <Notice tone="error" {...errorNoticeProps}>
                {err}
              </Notice>
            )}
          </div>

          {/* The trading-card pile (board `KZF-0`): three specimens of the ladder, tilted. */}
          <ul
            data-slot="hero-pile"
            /* `w-full` inside a `max-w`, never a fixed width: an `auto` grid track sizes to its
               item's max-content, so a 405px box would widen the column past the phone viewport */
            className="relative m-0 mx-auto aspect-[405/281] w-full max-w-[405px] min-w-0 list-none p-0"
          >
            {heroCards.map((card, index) => {
              const image = frameImageProps[card.tierKey]
              return (
                <li
                  key={card.tierKey}
                  data-slot="hero-card"
                  data-glow-style={card.glowStyle}
                  className={cn(
                    PILE_CARD,
                    PILE_LAYOUT[index] ?? PILE_LAYOUT[0],
                    tierFrameClasses(card.tierKey),
                  )}
                >
                  <span className="foil-frame foil-media relative block overflow-hidden rounded-field bg-surface-pressed">
                    <span
                      data-slot="hero-card-slot"
                      className="relative block aspect-[4/3] w-full"
                      {...frameSlotProps[card.tierKey]}
                    >
                      {image ? (
                        <img
                          data-slot="hero-card-art"
                          className="block h-full w-full object-cover"
                          {...image}
                        />
                      ) : null}
                    </span>
                  </span>
                  <span
                    className={cn(
                      DISPLAY,
                      'mx-1 mt-1.5 mb-1.5 block pr-[52px] text-[13px]/[110%] md:text-[15px]/[110%]',
                    )}
                  >
                    {card.caption}
                  </span>
                  <TierChip
                    tierKey={card.tierKey}
                    label={card.tierName}
                    /* the pile's seal is one step under the grid thumb's: the board letters it
                       at 11/14 in a 7/3 pill so it never crowds a 144px card's title */
                    className="absolute right-2.5 bottom-2.5 px-[7px] py-[3px] text-[11px]/[14px]"
                  />
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* How it works (board `DSJ-0` … `DSW-0`) */}
      <section data-slot="landing-how" className={SECTION}>
        <h2 className={SECTION_TITLE}>A card gets better when it gets around.</h2>
        <ol className="mt-6 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
          {HOW_IT_WORKS.map((step) => (
            <li key={step.step} className={CARD}>
              {/* the board's step number sits in the accent; `link` is the guarded ultraviolet
                  pair — `--color-focus` on a surface misses Lc 60 in the dark arm */}
              <span className="block text-small font-extrabold text-link tabular-nums">
                {step.step}
              </span>
              <h3 className={cn(DISPLAY, 'mt-3 mb-0 text-[21px]/[26px]')}>{step.title}</h3>
              <p className="mt-2 mb-0 text-small/[20px] text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* The tier ladder (board `DT1-0` … `DTY-0`) */}
      <section data-slot="landing-tiers" className={SECTION}>
        <h2 className={LADDER_TITLE} id="tiers">
          The Virality Tiers
        </h2>
        {/* an ordered climb, so the ladder is an <ol>: the sequence is the section's argument */}
        <ol className="mt-6 grid list-none grid-cols-[repeat(auto-fill,minmax(136px,1fr))] gap-3 p-0 max-sm:grid-cols-2 4xl:grid-cols-7">
          {tiers.map((t) => (
            <li
              key={t.key}
              data-slot="tier-card"
              data-glow-style={t.glowStyle}
              /* `tier-card` is part of the foil effect API (`atoms/foil.css`): it is what the
                 forced-colors rarity border keys off. The box model around it is this screen's. */
              className={cn(
                'tier-card flex flex-col rounded-card bg-surface-raised p-3 shadow-raised',
                tierFrameClasses(t.key),
              )}
            >
              {/* the slot is permanent, so loading, ready and failed all keep the same box */}
              <span className="foil-frame foil-media relative block overflow-hidden rounded-field bg-surface-pressed">
                <span
                  data-slot="tier-frame-slot"
                  className="relative block aspect-[4/3] min-h-[104px] w-full"
                  {...frameSlotProps[t.key]}
                >
                  {frameImageProps[t.key] ? (
                    <img
                      data-slot="tier-frame-img"
                      className="block h-full w-full object-cover"
                      {...frameImageProps[t.key]}
                    />
                  ) : null}
                </span>
              </span>
              <h3 className={cn(DISPLAY, 'mt-3 mb-0 text-[15px]/[19px] md:text-[19px]/[24px]')}>
                {t.name}
              </h3>
              <span className="mt-2.5 text-small/[18px] font-bold text-link tabular-nums">
                {t.resharesLabel}
              </span>
              <span className="mt-[3px] text-micro/[15px] text-ink-muted">{t.rarityLabel}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ (board `DU3-0`) */}
      <section data-slot="landing-faq" className={SECTION}>
        <h2 className={cn(DISPLAY, 'm-0 mb-6 text-[29px]/[36px]')}>FAQ</h2>
        <div className="max-w-[780px]">
          <FaqItem question="How does a card level up?" defaultOpen>
            <p>
              Each unique share link and card unfurl counts as a reshare. Cross a threshold and the
              meme tiers up: Paper → Silver → Holo → Chrome → Gold → Prismatic → ✨Shiny✨. The link
              preview card (the og image) upgrades its foil frame automatically, so a Gold meme
              flexes gold wherever it lands.
            </p>
          </FaqItem>
          <FaqItem question="Can I keep a meme private?">
            <p>
              Only a meme’s sole owner can make it private — that pulls it off every public surface.
              Once shares are split between holders it stays in the market.
            </p>
          </FaqItem>
          <FaqItem question="WTF is MemeOn?">
            <p>
              A meme trading card market. You mint memes (upload or generate them with your Masky
              credits), each one becomes a 100-share collectible card, and its rarity tier is driven
              by real reshares of its unique link.
            </p>
          </FaqItem>
          <FaqItem question="What are braincells? 🧠">
            <img
              src="/api/brand/braincell.png"
              alt="a braincell"
              className="mt-1.5 mb-1.5 ml-3 h-[72px] w-[72px] float-right rounded-full object-cover align-middle"
            />
            <p>
              Braincells are MemeOn's currency — you buy meme shares, fund trades, and flex on the
              🏆 Top Brains leaderboard with them. Everyone starts at zero (smoothbrained, sorry) and
              earns their first braincells through the onboarding quests: claim your free starter
              pack, mint your first meme, get your first reshare, make a friend, close a trade. AI
              generation is separate — that runs on your own Masky credits.
            </p>
          </FaqItem>
          <FaqItem question="How do tiers work?">
            <p>
              Every meme has a share URL (memeon.ai/m/…). Each time that link is loaded — a friend
              clicks it, Discord unfurls it, a bot scrapes it — the counter ticks up, and every new
              place it's shared is counted separately as a reshare. Seven tiers, from Paper at zero
              to ✨Shiny✨ at 25,000.
            </p>
          </FaqItem>
          <FaqItem question="What's Masky got to do with it?">
            <p>
              Login is "Log in with Masky" — your Masky avatar is your identity here, and meme
              generation (images and videos) runs on your own Masky credits. Your real identity
              stays protected: MemeOn only ever sees your avatar, never who's behind the mask. And
              your avatar can do more than represent you — configure an agentic harness for it on
              Masky and it runs as an agent on your behalf: auto-approving or proposing trades,
              minting new memes with AI, watching for memes catching reshare momentum, and generally
              maximizing your braincells while you sleep.
            </p>
          </FaqItem>
        </div>
      </section>

      {/* Closing CTA (board `DUA-0`): the page's one ultraviolet plate, carrying one bubblegum. */}
      {showMarketplaceCta || showLoginButton ? (
        <section
          data-slot="landing-closing"
          className={cn(
            'mt-10 flex items-center justify-between gap-4 rounded-card bg-action-secondary',
            'px-[25px] py-[22px] shadow-raised',
            'max-lg:flex-col max-lg:items-stretch max-lg:gap-4',
          )}
        >
          <p
            className={cn(
              'm-0 font-display font-medium tracking-title text-on-action-secondary',
              'text-[21px]/[26px] md:text-[25px]/[31px]',
            )}
          >
            {closingLine}
          </p>
          {showMarketplaceCta ? (
            marketplaceCta
          ) : (
            <Button variant="login" {...closingLoginButtonProps}>
              {closingLoginLabel}
            </Button>
          )}
        </section>
      ) : null}
    </PageContainer>
  )
}
