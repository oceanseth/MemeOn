import { buttonClasses } from '../atoms/Button'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { Spinner } from '../atoms/Spinner'
import { cn } from '../lib/cn'
import type { DiscordPageScreenModel } from '../hooks/useDiscordPageScreen'
import { FaqItem } from '../molecules/FaqItem'

/** `.hero h1 .grad`, shared with InviteScreen (social) — same gradient, same fallback stack. */
const GRAD = cn(
  'bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-2),var(--color-gold))] bg-clip-text text-transparent',
  'supports-[not(background-clip:text)]:bg-none supports-[not(background-clip:text)]:text-accent',
  'forced-colors:bg-none forced-colors:text-[CanvasText]',
)

/**
 * Deliberately not the app's `login` gradient: this is the one CTA that carries Discord's own
 * brand color instead of MemeOn's primary gradient, per spec. `bg-none` clears `buttonClasses`'
 * gradient `background-image` so the flat `bg-brand-discord` `background-color` shows through.
 */
const discordCta = cn(buttonClasses('login'), 'bg-none bg-brand-discord')

/** Discord install landing as a function of its model. Every engine state is one set of args. */
export function DiscordPageScreen({
  showLoading,
  showInstall,
  showPending,
  showError,
  installSteps,
  installLinkProps,
}: DiscordPageScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <section className="px-4 pt-[72px] pb-10 text-center max-xl:px-4 max-xl:pt-9 max-xl:pb-7">
        <h1 className="m-0 mb-3.5 text-[clamp(34px,6vw,60px)] leading-[1.05] font-bold">
          MemeOn <span className={GRAD}>for Discord</span>
        </h1>
        <p className="mx-auto mb-7 max-w-[640px] text-lg text-pretty text-text-dim">
          The GIF picker, but the cards level up. Type <code>/memeon</code> in any chat, search with
          live results — your binder 💼 and friends' memes 🤝 rank first — and drop a card. Every
          card posted is a share link: it unfurls with its current foil tier frame and{' '}
          <strong>counts as a reshare</strong>, pushing the meme up the tiers.
        </p>
        {/* one reserved box for every phase, so the CTA never pops the page down when config lands */}
        <div className="flex min-h-[55px] items-center justify-center">
          {showLoading && (
            <span className={discordCta} aria-disabled="true">
              <Spinner />
              Checking Discord…
            </span>
          )}
          {showInstall && (
            <a {...installLinkProps} className={discordCta}>
              🧠 Add MemeOn to Discord
              <span className="sr-only"> (opens Discord in a new tab)</span>
            </a>
          )}
          {showPending && (
            <Notice tone="info" className="mt-0" role="status">
              Almost live — the Discord app is being registered. Check back soon!
            </Notice>
          )}
          {showError && (
            <Notice tone="error" className="mt-0" role="alert">
              Couldn't reach MemeOn — reload to try again.
            </Notice>
          )}
        </div>
      </section>

      <section aria-labelledby="discord-how" className="max-w-[780px]">
        <h2 id="discord-how" className="font-bold">How it works</h2>
        <FaqItem question="Install (10 seconds)" defaultOpen>
          <p>
            {installSteps} Choose <strong>Add to My Apps</strong> (works in every server and DM, no
            admin needed) or add it to a server you manage. That's it — type <code>/memeon</code>{' '}
            anywhere.
          </p>
        </FaqItem>
        <FaqItem question="Connect your MemeOn account">
          <p>
            Run <code>/memeon-connect</code> in Discord and follow the private link — one Masky
            login and your searches put your own binder and your friends' memes above the public
            pool. Your Discord identity is never shown to other MemeOn users.
          </p>
        </FaqItem>
        <FaqItem question="Why every drop matters">
          <p>
            Cards posted through <code>/memeon</code> use the meme's unique share URL — each post
            (and each unfurl) ticks the reshare counter that drives the Paper → ✨Shiny✨ tier
            ladder. Sharing is literally how a card levels up.
          </p>
        </FaqItem>
      </section>

      <section className="max-w-[780px]">
        <FaqItem question="Brand assets">
          <p>The MemeOn brain — grab it for bots, servers, or wherever you rep the market.</p>
          <p className="flex flex-wrap items-center gap-2.5">
            <img
              src="/brand/memeon-logo-circle-64.png"
              srcSet="/brand/memeon-logo-circle-64.png 1x, /brand/memeon-logo-circle-256.png 2x"
              alt="MemeOn brain logo"
              width={64}
              height={64}
              loading="lazy"
              decoding="async"
            />
            <a className={buttonClasses()} href="/brand/memeon-logo-1024.png" download="memeon-logo-1024.png">
              ⬇ Full size (1024px · 1.4 MB)
            </a>
            <a
              className={buttonClasses()}
              href="/brand/memeon-logo-circle-256.png"
              download="memeon-logo-256.png"
            >
              ⬇ Optimized (256px, round)
            </a>
          </p>
        </FaqItem>
      </section>
    </PageContainer>
  )
}
