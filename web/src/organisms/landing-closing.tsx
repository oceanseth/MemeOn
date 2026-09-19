import type { ReactNode } from 'react'
import { Button } from '@/atoms/button'
import { cn } from '../lib/cn'
import type { LandingScreenModel } from '../hooks/useLandingScreen'

type LandingClosingProps = Pick<
  LandingScreenModel,
  | 'showMarketplaceCta'
  | 'showLoginButton'
  | 'closingLine'
  | 'closingLoginLabel'
  | 'closingLoginButtonProps'
> & { cta: ReactNode }

/** Closing plate: the page finishes convincing here, so the CTA repeats under the FAQ. */
export function LandingClosing({
  showMarketplaceCta,
  showLoginButton,
  closingLine,
  closingLoginLabel,
  closingLoginButtonProps,
  cta,
}: LandingClosingProps) {
  if (!showMarketplaceCta && !showLoginButton) return null

  return (
    /* ultraviolet plate with one bubblegum pill */
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
        cta
      ) : (
        <Button variant="primary" size="login" {...closingLoginButtonProps}>
          {closingLoginLabel}
        </Button>
      )}
    </section>
  )
}
