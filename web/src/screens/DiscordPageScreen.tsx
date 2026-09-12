import { buttonClasses } from '../atoms/Button'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { Panel } from '../atoms/Panel'
import { Spinner } from '../atoms/Spinner'
import { cn } from '../lib/cn'
import type { DiscordPageScreenModel } from '../hooks/useDiscordPageScreen'

/**
 * A flow card (`EI8-0`/`EID-0`/`EII-0`): the surface card at radius 23 with 17/20 padding — the
 * eyebrow is the command, then the promise, then the plain line under it.
 */
const FLOW_CARD = 'rounded-control px-5 py-[17px] max-md:px-5 max-md:py-[17px]'

/**
 * `/memeon` (`EI9-0`): 15/19 weight 800 — the command, not a heading. The board paints it in the
 * focus colour, which measures APCA Lc -53.1 on the dark surface (below the swarm's floor of 60),
 * so it takes `--color-link`, the accent `check-contrast` already guards in both arms.
 */
const FLOW_COMMAND = 'm-0 text-label font-bold text-link'

const FLOW_TITLE = 'mt-2 mb-0 font-display text-card-title font-medium tracking-card-title text-ink'

/** The line under it (`EIB-0`): 14/18 weight 500 on ink-muted. */
const FLOW_BODY = 'mt-[5px] mb-0 text-small font-medium text-ink-muted'

/** A FAQ question (`EIP-0`): 16/20 weight 700; its answer is `FLOW_BODY` at the same measure. */
const FAQ_QUESTION = 'mt-5 mb-0 text-intro font-semibold tracking-normal text-ink first:mt-0'

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
      <PageHead
        level="h1"
        title="MemeOn for Discord"
        subtitle="The GIF picker, but the cards level up. Type /memeon in any chat, drop a live card, and every unfurl counts as a reshare."
        className="mt-9 mb-6 max-md:mt-5"
      />
      {/* one reserved box for every phase, so the CTA never pops the page down when config lands */}
      <div className="flex min-h-[54px] flex-wrap items-center gap-2 max-md:flex-col max-md:items-start">
        {showLoading && (
          <span className={buttonClasses('primary')} aria-disabled="true">
            <Spinner />
            Checking Discord…
          </span>
        )}
        {showInstall && (
          <>
            <a {...installLinkProps} className={buttonClasses('primary')} aria-describedby="discord-cta-note">
              🧠 Add MemeOn to Discord
            </a>
            <span id="discord-cta-note" className="ms-3 text-caption font-medium text-ink-muted max-md:ms-0">
              opens Discord in a new tab
            </span>
          </>
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

      <section aria-labelledby="discord-how" className="mt-8 flex flex-col gap-[19px]">
        <h2 id="discord-how" className="sr-only">
          How it works
        </h2>
        <Panel className={FLOW_CARD}>
          <p className={FLOW_COMMAND}>/memeon</p>
          <p className={FLOW_TITLE}>Search live cards</p>
          <p className={FLOW_BODY}>Your binder 💼 and friends' memes 🤝 rank first.</p>
        </Panel>
        <Panel className={FLOW_CARD}>
          <p className={FLOW_COMMAND}>/memeon-connect</p>
          <p className={FLOW_TITLE}>Make it yours</p>
          <p className={FLOW_BODY}>A private link connects one Masky account.</p>
        </Panel>
        <Panel className={FLOW_CARD}>
          <p className={FLOW_COMMAND}>Paper → ✨Shiny✨</p>
          <p className={FLOW_TITLE}>Make every drop matter</p>
          <p className={FLOW_BODY}>Every post ticks the reshare counter.</p>
        </Panel>
      </section>

      <Panel
        aria-labelledby="discord-faq"
        className={cn('mt-6 bg-surface-raised p-6 max-md:p-6', '[&_h2]:m-0')}
      >
        <h2 id="discord-faq" className="font-display text-section-phone font-medium tracking-title text-ink md:text-section">
          Tiny FAQ
        </h2>
        <p className={cn(FAQ_QUESTION, 'mt-5')}>Does this need a server admin?</p>
        <p className={FLOW_BODY}>
          No. {installSteps} Choose <strong>Add to My Apps</strong> for every server and DM, or add
          it to a server you manage.
        </p>
        <p className={cn(FAQ_QUESTION, 'mt-[18px]')}>Is my Discord identity public?</p>
        <p className={FLOW_BODY}>Never. It only improves your own ranked search.</p>
      </Panel>

      <Panel className="mt-6 flex flex-wrap items-center gap-3 rounded-control px-5 py-[15px] max-md:flex-col max-md:items-start max-md:px-5 max-md:py-[15px]">
        <h2 className="m-0 font-display text-card-title-phone font-medium tracking-card-title text-ink">
          MemeOn brain assets
        </h2>
        <span className="flex flex-wrap items-center gap-2">
          <a className={buttonClasses()} href="/brand/memeon-logo-1024.png" download="memeon-logo-1024.png">
            {/* no drawn download glyph exists in the Central set: the ⬇ text keeps its own slot */}
            <span aria-hidden="true" className="inline-flex w-5 shrink-0 justify-center">⬇</span>
            Full size
          </a>
          <a
            className={buttonClasses()}
            href="/brand/memeon-logo-circle-256.png"
            download="memeon-logo-256.png"
          >
            <span aria-hidden="true" className="inline-flex w-5 shrink-0 justify-center">⬇</span>
            Round
          </a>
        </span>
      </Panel>
    </PageContainer>
  )
}
