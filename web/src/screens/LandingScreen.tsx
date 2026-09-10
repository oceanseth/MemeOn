import { Link } from 'react-router-dom'
import { Button, buttonClasses } from '../atoms/Button'
import { tierClasses } from '../atoms/MemeCard'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { cn } from '../lib/cn'
import type { LandingScreenModel } from '../hooks/useLandingScreen'
import { FaqItem } from '../molecules/FaqItem'
import './LandingScreen.css'

const SECTION_TITLE = 'mt-14 mb-1.5 text-[26px] font-bold'
const SECTION_SUB = 'mb-6 text-text-dim'

/** Landing as a function of its model. Every engine state is one set of args. */
export function LandingScreen({
  err,
  showMarketplaceCta,
  showLoginButton,
  showErr,
  loginLabel,
  closingLine,
  closingLoginLabel,
  hero,
  tiers,
  loginButtonProps,
  closingLoginButtonProps,
  frameImageProps,
  frameSlotProps,
  errorNoticeProps,
}: LandingScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <section className="px-4 pt-[72px] pb-10 text-center max-xl:px-4 max-xl:pt-9 max-xl:pb-7">
        <h1 className="m-0 mb-3.5 text-[clamp(34px,6vw,60px)] leading-[1.05] font-bold">
          Memes are the new{' '}
          <span
            className={cn(
              'bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-2),var(--color-gold))] bg-clip-text text-transparent',
              'supports-[not(background-clip:text)]:bg-none supports-[not(background-clip:text)]:text-accent',
              'forced-colors:bg-none forced-colors:text-[CanvasText]',
            )}
          >
            trading cards
          </span>
        </h1>
        <p className="mx-auto mb-7 max-w-[640px] text-lg text-pretty text-text-dim">
          Mint your memes, watch them climb the virality tiers as they get reshared, and trade
          positions with friends. Every meme gets a share link whose card frame levels up as it
          spreads.
        </p>
        {hero}
        {showMarketplaceCta ? (
          <Link className={buttonClasses('login')} to="/marketplace">
            📈 Enter the marketplace
          </Link>
        ) : showLoginButton ? (
          <>
            <Button variant="login" {...loginButtonProps}>
              {loginLabel}
            </Button>
            <p className="mx-auto mt-2.5 mb-0 max-w-[44ch] text-sm text-text-dim">
              No email. No real name. Just your Masky avatar.
            </p>
          </>
        ) : null}
        {showErr && (
          <Notice tone="error" {...errorNoticeProps}>
            {err}
          </Notice>
        )}
      </section>

      <h2 className={SECTION_TITLE} id="tiers">
        The Virality Tiers
      </h2>
      <p className={SECTION_SUB}>
        Views power everything. Share a meme's link anywhere — every load of that link counts — and
        its card physically transforms as it ascends.
      </p>
      {/* an ordered climb, so the ladder is an <ol>: the sequence is the section's argument */}
      <ol className="m-0 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-[18px] p-0 list-none 4xl:grid-cols-4 max-sm:grid-cols-2 max-sm:gap-3">
        {tiers.map((t) => (
          <li
            key={t.key}
            data-slot="tier-card"
            data-glow-style={t.glowStyle}
            /* `tier-card` stays: the card package's forced-colors border (tier-glow-borders.css)
               keys off this literal class, not a data-slot. Its own box-model rule is superseded
               by the utilities below. */
            className={cn('tier-card rounded-(--radius) p-(--glow-width)', tierClasses(t.key))}
          >
            <div
              data-slot="tier-card-inner"
              /* `tier-card-inner` stays too: 08-meme-card.css rounds `.foil-media` from it, and
                 51-a11y-media.css pauses the sheen/sparkle sweep on it under reduced motion. */
              className="tier-card-inner relative flex h-full flex-col gap-2 overflow-hidden rounded-[calc(var(--radius)-var(--glow-width))] bg-bg-card p-3.5"
            >
              {/* the slot is permanent, so loading, ready and failed all keep the same box */}
              <div className="foil-media">
                <div
                  data-slot="tier-frame-slot"
                  className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-bg-media"
                  {...frameSlotProps[t.key]}
                >
                  {frameImageProps[t.key] ? (
                    <img
                      data-slot="tier-frame-img"
                      className="block h-full w-full rounded-none bg-bg-media object-cover"
                      {...frameImageProps[t.key]}
                    />
                  ) : null}
                </div>
              </div>
              <h3 className="text-[17px] font-extrabold" style={{ color: t.color }}>
                {t.name}
              </h3>
              <span className="text-xs font-semibold tracking-[0.4px] text-text-dim">
                {t.requirementLabel}
              </span>
              <span className="text-[13px] leading-[1.45] text-text-dim">{t.hype}</span>
            </div>
          </li>
        ))}
      </ol>

      <h2 className={SECTION_TITLE}>FAQ</h2>
      <div className="max-w-[780px]">
        <FaqItem question="WTF is MemeOn?" defaultOpen>
          <p>
            A meme trading card market. You mint memes (upload or generate them with your Masky
            credits), each one becomes a 100-share collectible card, and its rarity tier is driven
            by real views of its unique link.
          </p>
        </FaqItem>
        <FaqItem question="How do tiers work?">
          <p>
            Every meme has a share URL (memeon.ai/m/…). Each time that link is loaded — a friend
            clicks it, Discord unfurls it, a bot scrapes it — the view counter ticks up (and every
            new place it's shared is counted separately as a reshare). Cross a view
            threshold and the meme tiers up: Paper → Silver → Holo → Chrome → Gold → Prismatic →
            ✨Shiny✨. The link preview card (the og image) upgrades its foil frame automatically,
            so a Gold meme flexes gold wherever it's shared.
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
        <FaqItem question="How do I invest in a meme?">
          <p>
            Memes are split into 100 shares. Holders can list shares at a price in braincells 🧠;
            you can buy from the Marketplace, or propose direct trades (shares + braincells for
            shares + braincells) with friends. When your meme sells or tiers up, you get an alert.
          </p>
        </FaqItem>
        <FaqItem question="What's Masky got to do with it?">
          <p>
            Login is "Sign in with Masky" — your Masky avatar is your identity here, and meme
            generation (images and videos) runs on your own Masky credits. Your real identity
            stays protected: MemeOn only ever sees your avatar, never who's behind the mask. And
            your avatar can do more than represent you — configure an agentic harness for it on
            Masky and it runs as an agent on your behalf: auto-approving or proposing trades,
            minting new memes with AI, watching for memes catching reshare momentum, and generally
            maximizing your braincells while you sleep.
          </p>
        </FaqItem>
      </div>

      {/* the FAQ is where the page finishes convincing, so the CTA is there too */}
      {showMarketplaceCta || showLoginButton ? (
        <section className="mt-8 mb-2 text-center">
          <p>{closingLine}</p>
          {showMarketplaceCta ? (
            <Link className={buttonClasses('login')} to="/marketplace">
              📈 Enter the marketplace
            </Link>
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
