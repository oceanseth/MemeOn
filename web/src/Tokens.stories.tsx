import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { cn } from './lib/cn'

/**
 * The Soft Press token sheet: every semantic colour, the two ramps, the seven tier chips, the two
 * materials, the radii, the spacing roles, the container widths and the type ladder, painted with
 * nothing but the utilities `index.css` emits. It is the swarm's visual reference — if a token looks
 * wrong here it is wrong everywhere — and a probe: each swatch carries `data-slot="swatch-<token>"`
 * (`spacing-<token>`, `container-<token>`) for `getComputedStyle`.
 */

const SEMANTIC: ReadonlyArray<{ token: string; bg: string; text?: string }> = [
  { token: 'canvas', bg: 'bg-canvas' },
  { token: 'canvas-alt', bg: 'bg-canvas-alt' },
  { token: 'surface', bg: 'bg-surface' },
  { token: 'surface-raised', bg: 'bg-surface-raised' },
  { token: 'surface-pressed', bg: 'bg-surface-pressed' },
  { token: 'ink', bg: 'bg-ink' },
  { token: 'ink-muted', bg: 'bg-ink-muted' },
  { token: 'line', bg: 'bg-line' },
  { token: 'link', bg: 'bg-link' },
  { token: 'focus', bg: 'bg-focus' },
  { token: 'action', bg: 'bg-action', text: 'text-on-action' },
  { token: 'action-secondary', bg: 'bg-action-secondary', text: 'text-on-action-secondary' },
  { token: 'success-surface', bg: 'bg-success-surface', text: 'text-success-text' },
  { token: 'warning-surface', bg: 'bg-warning-surface', text: 'text-warning-text' },
  { token: 'error-surface', bg: 'bg-error-surface', text: 'text-error-text' },
  { token: 'info-surface', bg: 'bg-info-surface', text: 'text-info-text' },
  { token: 'success-text', bg: 'bg-success-text' },
  { token: 'warning-text', bg: 'bg-warning-text' },
  { token: 'error-text', bg: 'bg-error-text' },
  { token: 'info-text', bg: 'bg-info-text' },
  { token: 'shadow', bg: 'bg-shadow' },
  { token: 'highlight', bg: 'bg-highlight' },
  { token: 'scrim', bg: 'bg-scrim' },
  { token: 'brand-discord', bg: 'bg-brand-discord' },
]

const BUBBLEGUM = [
  ['50', 'bg-bubblegum-50'],
  ['100', 'bg-bubblegum-100'],
  ['200', 'bg-bubblegum-200'],
  ['300', 'bg-bubblegum-300'],
  ['500', 'bg-bubblegum-500'],
  ['700', 'bg-bubblegum-700'],
  ['800', 'bg-bubblegum-800'],
  ['900', 'bg-bubblegum-900'],
  ['950', 'bg-bubblegum-950'],
] as const

const ULTRAVIOLET = [
  ['50', 'bg-ultraviolet-50'],
  ['100', 'bg-ultraviolet-100'],
  ['200', 'bg-ultraviolet-200'],
  ['300', 'bg-ultraviolet-300'],
  ['500', 'bg-ultraviolet-500'],
  ['700', 'bg-ultraviolet-700'],
  ['800', 'bg-ultraviolet-800'],
  ['900', 'bg-ultraviolet-900'],
  ['950', 'bg-ultraviolet-950'],
] as const

const TIERS: ReadonlyArray<{ key: string; label: string; chip: string; frame: string }> = [
  { key: 'paper', label: 'Paper', chip: 'bg-tier-paper-chip text-tier-paper-chip-text', frame: 'border-tier-paper-frame' },
  { key: 'silver', label: 'Silver', chip: 'bg-tier-silver-chip text-tier-silver-chip-text', frame: 'border-tier-silver-frame' },
  { key: 'holo', label: 'Holo', chip: 'bg-tier-holo-chip text-tier-holo-chip-text', frame: 'border-tier-holo-frame' },
  { key: 'chrome', label: 'Chrome', chip: 'bg-tier-chrome-chip text-tier-chrome-chip-text', frame: 'border-tier-chrome-frame' },
  { key: 'gold', label: 'Gold', chip: 'bg-tier-gold-chip text-tier-gold-chip-text', frame: 'border-tier-gold-frame' },
  {
    key: 'prismatic',
    label: 'Prismatic',
    chip: 'bg-tier-prismatic-chip bg-(image:--gradient-tier-prismatic-chip) text-tier-prismatic-chip-text',
    frame: 'border-tier-prismatic-frame',
  },
  { key: 'shiny', label: 'Shiny', chip: 'bg-tier-shiny-chip text-tier-shiny-chip-text', frame: 'border-tier-shiny-frame' },
]

const LADDER: ReadonlyArray<{ step: string; spec: string; className: string }> = [
  { step: 'hero', spec: 'Unbounded 500 · 48/52 · -0.04em', className: 'font-display font-medium text-hero tracking-display' },
  { step: 'hero-phone', spec: 'Unbounded 500 · 36/42', className: 'font-display font-medium text-hero-phone tracking-display' },
  { step: 'display', spec: 'Unbounded 500 · 44/55 · -0.04em', className: 'font-display font-medium text-display tracking-display' },
  { step: 'display-phone', spec: 'Unbounded 500 · 32/40', className: 'font-display font-medium text-display-phone tracking-display' },
  { step: 'section', spec: 'Unbounded 500 · 32/40 · -0.025em', className: 'font-display font-medium text-section tracking-title' },
  { step: 'section-phone', spec: 'Unbounded 500 · 26/32', className: 'font-display font-medium text-section-phone tracking-title' },
  { step: 'title', spec: 'Unbounded 500 · 27/34 · -0.025em', className: 'font-display font-medium text-title tracking-title' },
  { step: 'card-title', spec: 'Unbounded 500 · 23/27 · -0.02em', className: 'font-display font-medium text-card-title tracking-card-title' },
  { step: 'card-title-phone', spec: 'Unbounded 500 · 17/21', className: 'font-display font-medium text-card-title-phone tracking-card-title' },
  { step: 'intro', spec: 'Onest 400 · 17/22', className: 'font-sans text-intro' },
  { step: 'body', spec: 'Onest 400 · 16/24', className: 'font-sans text-body' },
  { step: 'label', spec: 'Onest 600 · 15/19', className: 'font-sans font-semibold text-label' },
  { step: 'small', spec: 'Onest 400 · 14/18', className: 'font-sans text-small' },
  { step: 'caption', spec: 'Onest 400 · 13/16', className: 'font-sans text-caption' },
  { step: 'micro', spec: 'Onest 700 · 12/16', className: 'font-sans font-bold text-micro' },
]

const RADII = [
  ['card 25', 'rounded-card'],
  ['control 23', 'rounded-control'],
  ['field 18', 'rounded-field'],
  ['nav 24', 'rounded-nav'],
  ['avatar 15', 'rounded-avatar'],
  ['chip 12', 'rounded-chip'],
  ['shell 32', 'rounded-shell'],
  ['tabbar 30', 'rounded-tabbar'],
  ['pill 999', 'rounded-pill'],
  ['band 28', 'rounded-band'],
  ['well 20', 'rounded-well'],
  ['segment 17', 'rounded-segment'],
  ['control-sm 13', 'rounded-control-sm'],
  ['avatar-hero 32', 'rounded-avatar-hero'],
] as const

/* `--spacing-*` roles, each drawn as a bar exactly that long; the `w-*` utility is the probe. */
const SPACING: ReadonlyArray<{ token: string; px: number; role: string; className: string }> = [
  { token: 'nav-gap', px: 5, role: 'icon ↔ label in a bottom-nav item', className: 'w-nav-gap' },
  { token: 'control-gap', px: 9, role: 'icon ↔ label inside a control', className: 'w-control-gap' },
  { token: 'chip-x', px: 9, role: 'tier chip and badge inline padding', className: 'w-chip-x' },
  { token: 'control-x', px: 18, role: 'control and field inline padding', className: 'w-control-x' },
  { token: 'gutter', px: 18, role: 'phone card inset, phone grid gap, toolbar ↔ grid', className: 'w-gutter' },
  { token: 'icon', px: 22, role: 'the icon lane', className: 'w-icon' },
  { token: 'control-sm', px: 34, role: 'small square control, header avatar, segment', className: 'w-control-sm' },
  { token: 'control', px: 46, role: 'button, pill, disclosure height', className: 'w-control' },
  { token: 'field', px: 50, role: 'Input, the search well', className: 'w-field' },
  { token: 'nav-item', px: 62, role: 'a bottom-nav item', className: 'w-nav-item' },
  { token: 'avatar-hero-phone', px: 74, role: 'hero avatar under max-sm', className: 'w-avatar-hero-phone' },
  { token: 'avatar-hero', px: 86, role: 'profile / invite hero avatar', className: 'w-avatar-hero' },
]

/* `--container-*` widths, drawn to scale against the 1440px app frame; `ch` steps are drawn in ch. */
const CONTAINERS: ReadonlyArray<{ token: string; spec: string; className: string }> = [
  { token: 'measure-sm', spec: '60ch · a notice, a caption paragraph', className: 'max-w-measure-sm' },
  { token: 'measure', spec: '65ch · body prose', className: 'max-w-measure' },
  { token: 'card', spec: '560px · the auth and invite card', className: 'max-w-card' },
  { token: 'page-narrow', spec: '760px · PageContainer narrow', className: 'max-w-page-narrow' },
  { token: 'hero-video', spec: '880px · the landing film', className: 'max-w-hero-video' },
  { token: 'app', spec: '1440px · the design frame', className: 'max-w-app' },
]

function Heading({ children }: { children: string }) {
  return <h2 className="mt-8 mb-3 text-title tracking-title">{children}</h2>
}

function Swatch({ token, bg, text }: { token: string; bg: string; text?: string }) {
  return (
    <li className="flex flex-col gap-1">
      <div
        data-slot={`swatch-${token}`}
        className={cn('flex h-14 items-center justify-center rounded-chip border border-line text-micro', bg, text)}
      >
        {text ? 'on it' : ''}
      </div>
      <code className="w-fit text-micro">{token}</code>
    </li>
  )
}

function Ramp({ name, steps }: { name: string; steps: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div className="flex flex-col gap-1">
      <code className="w-fit text-micro">{name}</code>
      <ul className="flex overflow-hidden rounded-chip border border-line" data-slot={`ramp-${name}`}>
        {steps.map(([step, bg]) => (
          <li key={step} className={cn('flex h-12 flex-1 items-end justify-center pb-1 text-micro', bg)}>
            <span className="rounded-pill bg-surface px-1 text-ink">{step}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TokenSheet() {
  return (
    <div className="mx-auto max-w-app bg-canvas p-6 text-ink" data-slot="token-sheet">
      <h1 className="text-display tracking-display">Soft Press tokens</h1>
      <p className="max-w-measure-sm text-intro text-ink-muted">
        Every colour below is a <code>light-dark()</code> pair; the theme toolbar flips <code>data-theme</code> on{' '}
        <code>&lt;html&gt;</code> and the browser picks the arm. Same markup, both arms.
      </p>

      <Heading>Semantic colours</Heading>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3">
        {SEMANTIC.map((entry) => (
          <Swatch key={entry.token} {...entry} />
        ))}
      </ul>

      <Heading>Ramps</Heading>
      <div className="grid gap-4 md:grid-cols-2">
        <Ramp name="bubblegum" steps={BUBBLEGUM} />
        <Ramp name="ultraviolet" steps={ULTRAVIOLET} />
      </div>

      <Heading>Tier chips and frames</Heading>
      <ul className="flex flex-wrap gap-4">
        {TIERS.map((tier) => (
          <li key={tier.key} className="flex flex-col items-center gap-2">
            <div
              data-slot={`tier-frame-${tier.key}`}
              className={cn('flex h-20 w-28 items-end rounded-field border-3 bg-surface-pressed p-2', tier.frame)}
            >
              <span
                data-slot={`tier-chip-${tier.key}`}
                className={cn('rounded-chip px-chip-x py-1 text-micro font-bold', tier.chip)}
              >
                {tier.label}
              </span>
            </div>
            <code className="text-micro">{tier.key}</code>
          </li>
        ))}
      </ul>

      <Heading>Materials</Heading>
      <div className="flex flex-wrap items-center gap-4 rounded-card bg-canvas-alt p-5">
        <span
          data-slot="material-raised"
          className="inline-flex h-control items-center rounded-control bg-surface-raised px-control-x text-label font-semibold shadow-raised"
        >
          Raised
        </span>
        <span
          data-slot="material-pressed"
          className="inline-flex h-control items-center rounded-control bg-surface-pressed px-control-x text-label font-semibold shadow-pressed"
        >
          Pressed
        </span>
        <span
          data-slot="material-primary"
          className="inline-flex h-control items-center rounded-control bg-action px-control-x text-label font-semibold text-on-action shadow-raised"
        >
          Primary
        </span>
        <span
          data-slot="material-secondary"
          className="inline-flex h-control items-center rounded-control bg-action-secondary px-control-x text-label font-semibold text-on-action-secondary shadow-raised"
        >
          Secondary
        </span>
        <span
          data-slot="material-destructive"
          className="inline-flex h-control items-center rounded-control bg-error-surface px-control-x text-label font-semibold text-error-text shadow-raised"
        >
          Destructive
        </span>
        <span
          data-slot="material-focus"
          className="inline-flex h-control items-center rounded-control bg-surface-raised px-control-x text-label font-semibold shadow-raised outline-3 outline-offset-2 outline-focus"
        >
          Focus
        </span>
        <button
          type="button"
          disabled
          data-slot="material-disabled"
          className="inline-flex h-control items-center rounded-control border-0 bg-surface-raised px-control-x text-label font-semibold opacity-(--state-disabled-opacity) shadow-raised"
        >
          Disabled
        </button>
        <span
          data-slot="material-field"
          className="inline-flex h-field w-64 items-center rounded-field bg-surface-pressed px-control-x text-body text-ink-muted shadow-pressed"
        >
          Search well
        </span>
        <span data-slot="material-pop" className="inline-flex rounded-card bg-surface px-4 py-3 text-small shadow-pop">
          pop
        </span>
        <span data-slot="material-modal" className="inline-flex rounded-card bg-surface px-4 py-3 text-small shadow-modal">
          modal
        </span>
      </div>

      <Heading>Radii</Heading>
      <ul className="flex flex-wrap gap-3">
        {RADII.map(([label, className]) => (
          <li key={className} className="flex flex-col items-center gap-1">
            <div className={cn('h-16 w-24 border-3 border-line bg-surface', className)} />
            <code className="text-micro">{label}</code>
          </li>
        ))}
      </ul>

      <Heading>Spacing roles</Heading>
      <ul className="flex flex-col gap-2">
        {SPACING.map(({ token, px, role, className }) => (
          <li key={token} className="grid items-center gap-x-4 md:grid-cols-[280px_1fr]">
            <code className="w-fit text-micro whitespace-normal">
              {token} · {px}px · {role}
            </code>
            <div className="flex items-center gap-2">
              <div data-slot={`spacing-${token}`} className={cn('h-3 rounded-pill bg-action', className)} />
              <span className="text-micro text-ink-muted tabular-nums">{px}</span>
            </div>
          </li>
        ))}
      </ul>

      <Heading>Widths</Heading>
      <ul className="flex flex-col gap-2 overflow-hidden">
        {CONTAINERS.map(({ token, spec, className }) => (
          <li key={token} className="flex flex-col gap-1">
            <code className="w-fit text-micro whitespace-normal">
              {token} · {spec}
            </code>
            <div
              data-slot={`container-${token}`}
              className={cn('h-3 w-full rounded-pill bg-action-secondary', className)}
            />
          </li>
        ))}
      </ul>

      <Heading>Type ladder</Heading>
      <ul className="flex flex-col gap-3">
        {LADDER.map(({ step, spec, className }) => (
          <li key={step} className="grid gap-x-4 gap-y-1 md:grid-cols-[280px_1fr] md:items-baseline">
            <code className="w-fit text-micro whitespace-normal" data-slot={`ladder-${step}`}>
              {step} · {spec}
            </code>
            <p className={className}>Memes are the new trading cards</p>
          </li>
        ))}
      </ul>

      <Heading>Headings from the base layer</Heading>
      <div className="rounded-card bg-surface p-5 shadow-raised">
        <h1>h1 is display</h1>
        <h2>h2 is title</h2>
        <h3>h3 is card-title</h3>
        <h4>h4 is card-title-phone</h4>
        <p>
          Body copy is Onest 16/24 on ink. A{' '}
          <a className="text-link underline underline-offset-[3px] decoration-1" href="#top">
            link
          </a>{' '}
          wears <code>--color-link</code>; inline{' '}
          <code>code</code> sits on the pressed surface. 🧠 2,480 · 👁️ 12 · 🔁 3
        </p>
      </div>
    </div>
  )
}

const meta = {
  title: 'Anatomy/Tokens',
  component: TokenSheet,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TokenSheet>

export default meta
type Story = StoryObj<typeof meta>

/** The utilities the theme emits, and the fonts, checked from the real DOM. */
async function assertTokensPainted(arm: 'light' | 'dark') {
  const root = document.documentElement
  await expect(root.dataset.theme).toBe(arm)
  await expect(getComputedStyle(root).colorScheme).toBe(arm)
  const canvas = root.querySelector<HTMLElement>('[data-slot="swatch-canvas"]')!
  const action = root.querySelector<HTMLElement>('[data-slot="swatch-action"]')!
  const raised = root.querySelector<HTMLElement>('[data-slot="material-raised"]')!
  const display = root.querySelector<HTMLElement>('[data-slot="ladder-display"]')!.nextElementSibling as HTMLElement
  await expect(getComputedStyle(canvas).backgroundColor).toContain(arm === 'light' ? 'oklch(0.975' : 'oklch(0.17 ')
  await expect(getComputedStyle(action).backgroundColor).toContain(arm === 'light' ? '345' : '235')
  await expect(getComputedStyle(raised).boxShadow).toContain('inset')
  await expect(getComputedStyle(raised).borderRadius).toBe('23px')
  await expect(getComputedStyle(raised).height).toBe('46px')
  await expect(getComputedStyle(raised).paddingInline).toBe('18px')
  const control = root.querySelector<HTMLElement>('[data-slot="spacing-control"]')!
  const gutter = root.querySelector<HTMLElement>('[data-slot="spacing-gutter"]')!
  const card = root.querySelector<HTMLElement>('[data-slot="container-card"]')!
  await expect(getComputedStyle(control).width).toBe('46px')
  await expect(getComputedStyle(gutter).width).toBe('18px')
  await expect(getComputedStyle(card).maxWidth).toBe('560px')
  await expect(getComputedStyle(display).fontSize).toBe('44px')
  await expect(getComputedStyle(display).lineHeight).toBe('55px')
  await expect(getComputedStyle(display).fontFamily).toContain('Unbounded Variable')
  await document.fonts.ready
  await expect(document.fonts.check("500 16px 'Unbounded Variable'")).toBe(true)
  await expect(document.fonts.check("400 16px 'Onest Variable'")).toBe(true)
}

export const Light: Story = {
  play: () => assertTokensPainted('light'),
}

export const Dark: Story = {
  globals: { theme: 'dark' },
  play: () => assertTokensPainted('dark'),
}

/**
 * Both arms in one frame: `scheme-light` / `scheme-dark` pin `color-scheme` on a subtree, and every
 * `light-dark()` token inside follows it — the same trick a dark-on-light overlay would use.
 */
export const SideBySide: Story = {
  render: () => (
    <div className="grid lg:grid-cols-2">
      <div className="scheme-light">
        <TokenSheet />
      </div>
      <div className="scheme-dark">
        <TokenSheet />
      </div>
    </div>
  ),
}
