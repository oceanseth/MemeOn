import { Alert } from '@/atoms/alert'
import { Button, buttonVariants } from '@/atoms/button'
import { Card, CardDescription, CardTitle } from '@/atoms/card'
import { Heading } from '@/atoms/heading'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import type { DiscordPageScreenModel } from '../hooks/useDiscordPageScreen'
import { Icon } from '@/atoms/icon'

/** Command line uses link colour — focus token misses contrast on dark surfaces. */
const FLOW_COMMAND = 'm-0 text-base font-semibold text-link'

/** Discord install landing as a function of its model. Every engine state is one set of args. */
export function DiscordPageScreen({
  pageTitle,
  showLoading,
  showInstall,
  showPending,
  showError,
  installSteps,
  installLinkProps,
  copy,
}: DiscordPageScreenModel) {
  const { pitch, busy, cta, pending, error, howHeading, steps, faq, assets } = copy
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead
        level="h1"
        title={pageTitle}
        subtitle={pitch}
        className="mt-9 mb-6 max-md:mt-5"
      />
      {/* one reserved box for every phase, so the CTA never pops the page down when config lands */}
      <div className="flex min-h-14 flex-wrap items-center gap-2 max-md:flex-col max-md:items-start">
        {showLoading && (
          <Button variant="primary" busy disabled focusableWhenDisabled>
            {busy}
          </Button>
        )}
        {showInstall && (
          <>
            {/* the brain is MemeOn's own mark on MemeOn's own install CTA — a 1:1 swap of the 🧠
                the design spells this button with, not a stand-in for Discord, which is text
                everywhere by design. Rasterised at 16: the two lobes and the midline survive at
                2x and still read at 1x, so it earns its size here. */}
            <a {...installLinkProps} className={buttonVariants({ variant: 'primary' })} aria-describedby="discord-cta-note">
              <span aria-hidden="true">
                <Icon name="brain" size={16} />
              </span>{' '}
              {cta.label}
            </a>
            <span id="discord-cta-note" className="ms-3 text-sm font-medium text-muted-foreground max-md:ms-0">
              {cta.newTabNote}
            </span>
          </>
        )}
        {showPending && (
          <Alert variant="info" role="status">
            {pending}
          </Alert>
        )}
        {showError && (
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        )}
      </div>

      <section aria-labelledby="discord-how" className="mt-8 flex flex-col gap-5">
        <h2 id="discord-how" className="sr-only">
          {howHeading}
        </h2>
        {steps.map((step) => (
          <Card key={step.command} size="xs">
            <p className={FLOW_COMMAND}>{step.command}</p>
            <CardTitle render={<h3 />} size="card-title" className="mt-2">
              {step.title}
            </CardTitle>
            <CardDescription className="mt-1">{step.body}</CardDescription>
          </Card>
        ))}
      </section>

      <Card variant="accent" aria-labelledby="discord-faq" className="mt-6">
        <Heading as="h2" size="section" id="discord-faq">
          {faq.heading}
        </Heading>
        <CardTitle render={<h3 />} className="mt-5">
          {faq.admin.question}
        </CardTitle>
        <CardDescription className="mt-1">
          {faq.admin.lead} {installSteps} {faq.admin.choose} <strong>{faq.admin.addToMyApps}</strong>{' '}
          {faq.admin.rest}
        </CardDescription>
        <CardTitle render={<h3 />} className="mt-4.5">
          {faq.identity.question}
        </CardTitle>
        <CardDescription className="mt-1">{faq.identity.body}</CardDescription>
      </Card>

      <Card size="xs" className="mt-6 flex flex-wrap items-center gap-3 max-md:flex-col max-md:items-start">
        <CardTitle render={<h2 />}>{assets.heading}</CardTitle>
        <span className="flex flex-wrap items-center gap-2">
          <a className={buttonVariants()} href="/brand/memeon-logo-1024.png" download="memeon-logo-1024.png">
            <span aria-hidden="true">
              <Icon name="download" size={16} />
            </span>{' '}
            {assets.fullSize}
          </a>
          <a
            className={buttonVariants()}
            href="/brand/memeon-logo-circle-256.png"
            download="memeon-logo-256.png"
          >
            <span aria-hidden="true">
              <Icon name="download" size={16} />
            </span>{' '}
            {assets.round}
          </a>
        </span>
      </Card>
    </PageContainer>
  )
}
