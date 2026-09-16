import { Alert } from '@/atoms/alert'
import { Button, buttonVariants } from '@/atoms/button'
import { Card, CardDescription, CardTitle } from '@/atoms/card'
import { Heading } from '@/atoms/heading'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import type { DiscordPageScreenModel } from '../hooks/useDiscordPageScreen'

/** Command line uses link colour — focus token misses contrast on dark surfaces. */
const FLOW_COMMAND = 'm-0 text-base font-semibold text-link'

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
      <div className="flex min-h-14 flex-wrap items-center gap-2 max-md:flex-col max-md:items-start">
        {showLoading && (
          <Button variant="primary" busy disabled focusableWhenDisabled>
            Checking Discord…
          </Button>
        )}
        {showInstall && (
          <>
            <a {...installLinkProps} className={buttonVariants({ variant: 'primary' })} aria-describedby="discord-cta-note">
              🧠 Add MemeOn to Discord
            </a>
            <span id="discord-cta-note" className="ms-3 text-sm font-medium text-muted-foreground max-md:ms-0">
              opens Discord in a new tab
            </span>
          </>
        )}
        {showPending && (
          <Alert variant="info" role="status">
            Almost live — the Discord app is being registered. Check back soon!
          </Alert>
        )}
        {showError && (
          <Alert variant="error" role="alert">
            Couldn't reach MemeOn — reload to try again.
          </Alert>
        )}
      </div>

      <section aria-labelledby="discord-how" className="mt-8 flex flex-col gap-5">
        <h2 id="discord-how" className="sr-only">
          How it works
        </h2>
        <Card size="xs">
          <p className={FLOW_COMMAND}>/memeon</p>
          <CardTitle render={<h3 />} size="card-title" className="mt-2">
            Search live cards
          </CardTitle>
          <CardDescription className="mt-1">Your binder 💼 and friends' memes 🤝 rank first.</CardDescription>
        </Card>
        <Card size="xs">
          <p className={FLOW_COMMAND}>/memeon-connect</p>
          <CardTitle render={<h3 />} size="card-title" className="mt-2">
            Make it yours
          </CardTitle>
          <CardDescription className="mt-1">A private link connects one Masky account.</CardDescription>
        </Card>
        <Card size="xs">
          <p className={FLOW_COMMAND}>Paper → ✨Shiny✨</p>
          <CardTitle render={<h3 />} size="card-title" className="mt-2">
            Make every drop matter
          </CardTitle>
          <CardDescription className="mt-1">Every post ticks the reshare counter.</CardDescription>
        </Card>
      </section>

      <Card variant="accent" aria-labelledby="discord-faq" className="mt-6">
        <Heading as="h2" size="section" id="discord-faq">
          Tiny FAQ
        </Heading>
        <CardTitle render={<h3 />} className="mt-5">
          Does this need a server admin?
        </CardTitle>
        <CardDescription className="mt-1">
          No. {installSteps} Choose <strong>Add to My Apps</strong> for every server and DM, or add
          it to a server you manage.
        </CardDescription>
        <CardTitle render={<h3 />} className="mt-4.5">
          Is my Discord identity public?
        </CardTitle>
        <CardDescription className="mt-1">Never. It only improves your own ranked search.</CardDescription>
      </Card>

      <Card size="xs" className="mt-6 flex flex-wrap items-center gap-3 max-md:flex-col max-md:items-start">
        <CardTitle render={<h2 />}>MemeOn brain assets</CardTitle>
        <span className="flex flex-wrap items-center gap-2">
          <a className={buttonVariants()} href="/brand/memeon-logo-1024.png" download="memeon-logo-1024.png">
            {/* no drawn download glyph exists in the Central set: the ⬇ text keeps its own slot */}
            <span aria-hidden="true" className="inline-flex w-5 shrink-0 justify-center">⬇</span>
            Full size
          </a>
          <a
            className={buttonVariants()}
            href="/brand/memeon-logo-circle-256.png"
            download="memeon-logo-256.png"
          >
            <span aria-hidden="true" className="inline-flex w-5 shrink-0 justify-center">⬇</span>
            Round
          </a>
        </span>
      </Card>
    </PageContainer>
  )
}
