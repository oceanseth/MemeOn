import { Link } from 'react-router-dom'
import { Alert } from '@/atoms/alert'
import { Button, buttonVariants } from '@/atoms/button'
import { tierFrameClasses } from '@/atoms/foil'
/* the foil sheet, imported directly (not by way of `atoms/MemeCard`'s side effect): this screen
   assembles the hero pile and the tier ladder from its own markup, on the dependency-free half of
   the seam */
import '@/atoms/foil.css'
import { Heading } from '@/atoms/heading'
import { PageContainer } from '@/atoms/page-container'
import { TierChip } from '@/atoms/tier-chip'
import { cn } from '../lib/cn'
import type { LandingScreenModel } from '../hooks/useLandingScreen'
import { FaqItem } from '@/molecules/faq-item'
import { HeroVideo } from '@/molecules/hero-video'
import './LandingScreen.css'

const SECTION = 'mt-14 max-md:mt-10'

const CARD = 'rounded-lg material-card p-4.5'

/** Hero pile card: percentage positions scale with the column, no phone transform. */
const PILE_CARD = 'absolute origin-top-left rounded-lg material-card p-2'

const PILE_LAYOUT = [
  'left-0 top-[19%] w-[38.2%]',
  'left-[26.3%] top-0 w-[41.8%] rotate-[-8deg]',
  'left-[55.9%] top-[23.3%] w-[35.4%] rotate-[10deg]',
] as const

/** How-it-works steps — emoji-free by design. */
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
  heroVideo,
  loginButtonProps,
  closingLoginButtonProps,
  frameImageProps,
  frameSlotProps,
  errorNoticeProps,
}: LandingScreenModel) {
  const marketplaceCta = (
    <Link className={buttonVariants({ variant: 'primary', size: 'login' })} to="/marketplace">
      🃏 Enter the marketplace
    </Link>
  )

  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      {/* hero band bleeds into the page gutter, not the shell sidebar gap */}
      <section
        data-slot="landing-hero"
        className="-mx-5 border-b border-border bg-accent px-5 pt-12 pb-14 max-md:pt-8 max-md:pb-10"
      >
        <div className="grid items-center gap-12 max-md:gap-8 lg:grid-cols-[minmax(0,570px)_minmax(0,405px)] lg:justify-between">
          <div className="min-w-0">
            <h1
              className={cn(
                'm-0 font-display text-4xl font-medium text-foreground text-balance',
                'md:text-6xl',
              )}
            >
              Memes are the new trading cards
            </h1>
            <p className="mt-5 mb-0 max-w-[65ch] text-pretty text-lg text-muted-foreground">
              Mint the moment. Watch it spread. Trade the cards everyone sends each other anyway —
              every meme gets a share link whose foil frame levels up as it travels.
            </p>
            {showMarketplaceCta ? (
              <div className="mt-7">{marketplaceCta}</div>
            ) : showLoginButton ? (
              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <Button variant="primary" size="login" {...loginButtonProps}>
                  {loginLabel}
                </Button>
                <p className="m-0 max-w-[24ch] text-sm text-muted-foreground">
                  No email. No real name. Just your Masky avatar.
                </p>
              </div>
            ) : null}
            {showErr && (
              <Alert variant="error" className="mt-3" {...errorNoticeProps}>
                {err}
              </Alert>
            )}
          </div>

          {/* three tilted tier specimens */}
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
                  <span className="foil-frame foil-media relative block overflow-hidden rounded-md bg-muted">
                    <span
                      data-slot="hero-card-slot"
                      className="relative block aspect-4/3 w-full"
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
                    className="mx-1 mt-1.5 mb-1.5 block pr-13 font-sans text-sm font-medium text-foreground md:text-base"
                  >
                    {card.caption}
                  </span>
                  <TierChip
                    tierKey={card.tierKey}
                    label={card.tierName}
                    /* pile seal at the grid thumb's own step (`size="sm"`), pinned to the corner */
                    className="absolute right-2.5 bottom-2.5"
                  />
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* how it works */}
      <section data-slot="landing-how" className={SECTION}>
        <Heading size="section">A card gets better when it gets around.</Heading>
        <ol className="mt-6 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
          {HOW_IT_WORKS.map((step) => (
            <li key={step.step} className={CARD}>
              {/* step number in link colour — focus token misses contrast on dark surfaces */}
              <span className="block text-sm font-semibold text-link tabular-nums">
                {step.step}
              </span>
              <Heading as="h3" size="card-title" className="mt-3">{step.title}</Heading>
              <p className="mt-2 mb-0 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* tier ladder */}
      <section data-slot="landing-tiers" className={SECTION}>
        <Heading size="section" id="tiers">
          The Virality Tiers
        </Heading>
        {/* an ordered climb, so the ladder is an <ol>: the sequence is the section's argument */}
        <ol className="mt-6 grid list-none grid-cols-[repeat(auto-fill,minmax(136px,1fr))] gap-3 p-0 max-sm:grid-cols-2 2xl:grid-cols-7">
          {tiers.map((t) => (
            <li
              key={t.key}
              data-slot="tier-card"
              data-glow-style={t.glowStyle}
              /* `tier-card` is part of the foil effect API (`atoms/foil.css`): it is what the
                 forced-colors rarity border keys off. The box model around it is this screen's. */
              className={cn(
                'tier-card flex flex-col rounded-lg material-raised p-3',
                tierFrameClasses(t.key),
              )}
            >
              {/* the slot is permanent, so loading, ready and failed all keep the same box */}
              <span className="foil-frame foil-media relative block overflow-hidden rounded-md bg-muted">
                <span
                  data-slot="tier-frame-slot"
                  className="relative block aspect-4/3 min-h-26 w-full"
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
              <Heading as="h3" size="card-title-phone" className="mt-3">
                {t.name}
              </Heading>
              <span className="mt-2.5 text-sm font-semibold text-link tabular-nums">
                {t.resharesLabel}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">{t.rarityLabel}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* The promo film: the whole loop in 50 seconds, framed like the cards above it, right
          before the FAQ answers the questions it raises. */}
      <section data-slot="landing-film" className={SECTION}>
        <Heading size="section">MemeOn in 50 seconds</Heading>
        <HeroVideo model={heroVideo} className="mt-6 max-w-220" />
      </section>

      {/* FAQ */}
      <section data-slot="landing-faq" className={SECTION}>
        <Heading size="section" className="mb-6">FAQ</Heading>
        <div className="max-w-[65ch]">
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
              className="mt-1.5 mb-1.5 ml-3 size-18 float-right rounded-full object-cover align-middle"
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

      {/* closing CTA — ultraviolet plate with one bubblegum pill */}
      {showMarketplaceCta || showLoginButton ? (
        <section
          data-slot="landing-closing"
          className={cn(
            'mt-10 flex items-center justify-between gap-4 rounded-lg material-raised bg-brand',
            'px-6 py-5.5',
            'max-lg:flex-col max-lg:items-stretch max-lg:gap-4',
          )}
        >
          <p
            className={cn(
              'm-0 font-display font-normal text-brand-foreground',
              'text-2xl md:text-3xl',
            )}
          >
            {closingLine}
          </p>
          {showMarketplaceCta ? (
            marketplaceCta
          ) : (
            <Button variant="primary" size="login" {...closingLoginButtonProps}>
              {closingLoginLabel}
            </Button>
          )}
        </section>
      ) : null}
    </PageContainer>
  )
}
