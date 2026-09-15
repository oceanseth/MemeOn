import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { cn } from './lib/cn'
import '@/atoms/foil.css'

/**
 * The token sheet: every colour role, the tier chips and frames, the materials, the radius steps,
 * the spacing roles, the container widths and the type ladder, painted with nothing but what
 * `index.css` emits. It is the visual reference — if a token looks wrong here it is wrong
 * everywhere — and a probe: each swatch carries a `data-slot` (`swatch-<token>`, `radius-<step>`,
 * `spacing-<role>`, `container-<name>`, `ladder-<step>`, `material-<name>`) and the play functions
 * compare its computed style with the token read back from `:root`, never with a literal.
 */

const SEMANTIC: ReadonlyArray<{ token: string; bg: string; text?: string }> = [
  { token: 'background', bg: 'bg-background', text: 'text-foreground' },
  { token: 'card', bg: 'bg-card', text: 'text-card-foreground' },
  { token: 'popover', bg: 'bg-popover', text: 'text-popover-foreground' },
  { token: 'accent', bg: 'bg-accent', text: 'text-accent-foreground' },
  { token: 'secondary', bg: 'bg-secondary', text: 'text-secondary-foreground' },
  { token: 'muted', bg: 'bg-muted', text: 'text-muted-foreground' },
  { token: 'foreground', bg: 'bg-foreground' },
  { token: 'muted-foreground', bg: 'bg-muted-foreground' },
  { token: 'border', bg: 'bg-border' },
  { token: 'input', bg: 'bg-input' },
  { token: 'ring', bg: 'bg-ring' },
  { token: 'link', bg: 'bg-link' },
  { token: 'primary', bg: 'bg-primary', text: 'text-primary-foreground' },
  { token: 'brand', bg: 'bg-brand', text: 'text-brand-foreground' },
  { token: 'destructive', bg: 'bg-destructive', text: 'text-destructive-foreground' },
  { token: 'success', bg: 'bg-success', text: 'text-success-foreground' },
  { token: 'warning', bg: 'bg-warning', text: 'text-warning-foreground' },
  { token: 'error', bg: 'bg-error', text: 'text-error-foreground' },
  { token: 'info', bg: 'bg-info', text: 'text-info-foreground' },
  { token: 'success-foreground', bg: 'bg-success-foreground' },
  { token: 'warning-foreground', bg: 'bg-warning-foreground' },
  { token: 'error-foreground', bg: 'bg-error-foreground' },
  { token: 'info-foreground', bg: 'bg-info-foreground' },
  { token: 'braincell', bg: 'bg-braincell' },
  { token: 'overlay', bg: 'bg-overlay' },
]

const TIERS: ReadonlyArray<{ key: string; label: string; chip: string }> = [
  { key: 'paper', label: 'Paper', chip: 'bg-tier-paper-chip text-tier-paper-chip-text' },
  { key: 'silver', label: 'Silver', chip: 'bg-tier-silver-chip text-tier-silver-chip-text' },
  { key: 'holo', label: 'Holo', chip: 'bg-tier-holo-chip text-tier-holo-chip-text' },
  { key: 'chrome', label: 'Chrome', chip: 'bg-tier-chrome-chip text-tier-chrome-chip-text' },
  { key: 'gold', label: 'Gold', chip: 'bg-tier-gold-chip text-tier-gold-chip-text' },
  {
    key: 'prismatic',
    label: 'Prismatic',
    chip: 'bg-tier-prismatic-chip bg-(image:--gradient-tier-prismatic-chip) text-tier-prismatic-chip-text',
  },
  { key: 'shiny', label: 'Shiny', chip: 'bg-tier-shiny-chip text-tier-shiny-chip-text' },
]

/** The materials, each painted by its utility and nothing else. */
const MATERIALS: ReadonlyArray<{ name: string; className: string; label: string }> = [
  { name: 'card', className: 'material-card', label: 'material-card' },
  { name: 'raised', className: 'material-raised', label: 'material-raised' },
  { name: 'pressed', className: 'material-pressed', label: 'material-pressed' },
  { name: 'pop', className: 'material-pop', label: 'material-pop' },
  { name: 'modal', className: 'material-modal', label: 'material-modal' },
  { name: 'glass', className: 'glass', label: 'glass' },
  { name: 'primary', className: 'material-raised bg-primary text-primary-foreground', label: 'raised · primary' },
  { name: 'brand', className: 'material-raised bg-brand text-brand-foreground', label: 'raised · brand' },
  { name: 'danger', className: 'material-raised bg-error text-error-foreground', label: 'raised · danger' },
  { name: 'ring', className: 'material-raised outline-3 outline-offset-2 outline-ring', label: 'the ring' },
]

const RADII: ReadonlyArray<{ step: string; className: string }> = [
  { step: 'xs', className: 'rounded-xs' },
  { step: 'sm', className: 'rounded-sm' },
  { step: 'md', className: 'rounded-md' },
  { step: 'lg', className: 'rounded-lg' },
  { step: 'xl', className: 'rounded-xl' },
  { step: 'full', className: 'rounded-full' },
]

/* `--spacing-*` roles, each drawn as a bar exactly that long; the `w-*` utility is the probe. */
const SPACING: ReadonlyArray<{ token: string; role: string; className: string }> = [
  { token: 'halo', role: 'the coarse-pointer halo around a 34px control', className: 'w-halo' },
  { token: 'track', role: 'a meter track', className: 'w-track' },
  { token: 'gutter', role: 'phone card inset, phone grid gap, toolbar ↔ grid', className: 'w-gutter' },
  { token: 'page-x', role: 'the page and shell gutter', className: 'w-page-x' },
  { token: 'icon', role: 'the icon lane', className: 'w-icon' },
  { token: 'card-inset', role: 'a card or panel inset', className: 'w-card-inset' },
  { token: 'bloom', role: 'the foil bloom guard around a card slot', className: 'w-bloom' },
  { token: 'control-sm', role: 'small square control, header avatar, segment', className: 'w-control-sm' },
  { token: 'hit', role: 'the pointer target', className: 'w-hit' },
  { token: 'control', role: 'button, pill, disclosure height', className: 'w-control' },
]

/* `--container-*` widths, drawn to scale; `measure` is in ch. */
const CONTAINERS: ReadonlyArray<{ token: string; spec: string; className: string }> = [
  { token: 'card-narrow', spec: '220px · a meme card too narrow for its meta row', className: 'max-w-card-narrow' },
  { token: 'tabbar', spec: '370px · the phone tab bar', className: 'max-w-tabbar' },
  { token: 'search', spec: '540px · the search well', className: 'max-w-search' },
  { token: 'card', spec: '560px · the auth and invite card', className: 'max-w-card' },
  { token: 'measure', spec: '65ch · body prose', className: 'max-w-measure' },
]

const LADDER: ReadonlyArray<{ step: string; spec: string; className: string; sample?: string }> = [
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
  { step: 'glyph-sm', spec: 'emoji · 16 / 1', className: 'text-glyph-sm', sample: '🎨 🌙 ☀️' },
  { step: 'glyph', spec: 'emoji · 20 / 1.25', className: 'text-glyph', sample: '🧠 🔔 🏆' },
  { step: 'glyph-lg', spec: 'emoji · 25 / 1.25', className: 'text-glyph-lg', sample: '🥇 🥈 🥉' },
  { step: 'glyph-hero', spec: 'emoji · 48 / 1.25', className: 'text-glyph-hero', sample: '🎉' },
]

function Heading({ children }: { children: string }) {
  return <h2 className="mt-8 mb-3 text-title tracking-title">{children}</h2>
}

function Swatch({ token, bg, text }: { token: string; bg: string; text?: string }) {
  return (
    <li className="flex flex-col gap-1">
      <div
        data-slot={`swatch-${token}`}
        className={cn('flex h-14 items-center justify-center rounded-sm border border-border text-micro', bg, text)}
      >
        {text ? 'on it' : ''}
      </div>
      <code className="w-fit text-micro">{token}</code>
    </li>
  )
}

export function TokenSheet() {
  return (
    <div className="mx-auto max-w-360 bg-background p-6 text-foreground" data-slot="token-sheet">
      <h1 className="text-display tracking-display">Tokens</h1>
      <p className="max-w-measure text-intro text-muted-foreground">
        Every colour below is a <code>light-dark()</code> pair; the theme toolbar flips <code>data-theme</code> on{' '}
        <code>&lt;html&gt;</code> and the browser picks the arm. Same markup, both arms.
      </p>

      <Heading>Colour roles</Heading>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3">
        {SEMANTIC.map((entry) => (
          <Swatch key={entry.token} {...entry} />
        ))}
      </ul>

      <Heading>Tier chips and frames</Heading>
      <ul className="flex flex-wrap gap-4">
        {TIERS.map((tier) => (
          <li key={tier.key} className="flex flex-col items-center gap-2">
            <div data-slot={`tier-frame-${tier.key}`} className={cn('foil-card rounded-md', `tier-${tier.key}`)}>
              <div className="foil-frame flex h-20 w-28 items-end rounded-md bg-muted p-2">
                <span data-slot={`tier-chip-${tier.key}`} className={cn('rounded-sm px-2 py-1 text-micro font-bold', tier.chip)}>
                  {tier.label}
                </span>
              </div>
            </div>
            <code className="text-micro">{tier.key}</code>
          </li>
        ))}
      </ul>

      <Heading>Materials</Heading>
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-muted p-5">
        {MATERIALS.map(({ name, className, label }) => (
          <span
            key={name}
            data-slot={`material-${name}`}
            className={cn('inline-flex h-control items-center rounded-lg px-4.5 text-label font-semibold', className)}
          >
            {label}
          </span>
        ))}
        <button
          type="button"
          disabled
          data-slot="material-disabled"
          className="disabled-look inline-flex h-control items-center rounded-lg material-raised px-4.5 text-label font-semibold"
        >
          disabled-look
        </button>
        <span
          data-slot="material-field"
          className="inline-flex h-12.5 w-64 items-center rounded-md material-pressed px-4.5 text-body text-muted-foreground"
        >
          the field well
        </span>
      </div>

      <Heading>Radius steps</Heading>
      <ul className="flex flex-wrap gap-3">
        {RADII.map(({ step, className }) => (
          <li key={step} className="flex flex-col items-center gap-1">
            <div data-slot={`radius-${step}`} className={cn('h-16 w-24 border-3 border-border bg-card', className)} />
            <code className="text-micro">{className}</code>
          </li>
        ))}
      </ul>

      <Heading>Spacing roles</Heading>
      <ul className="flex flex-col gap-2">
        {SPACING.map(({ token, role, className }) => (
          <li key={token} className="grid items-center gap-x-4 md:grid-cols-[280px_1fr]">
            <code className="w-fit text-micro whitespace-normal">
              {token} · {role}
            </code>
            <div data-slot={`spacing-${token}`} className={cn('h-3 rounded-full bg-primary', className)} />
          </li>
        ))}
      </ul>

      <Heading>Containers</Heading>
      <ul className="flex flex-col gap-2 overflow-hidden">
        {CONTAINERS.map(({ token, spec, className }) => (
          <li key={token} className="flex flex-col gap-1">
            <code className="w-fit text-micro whitespace-normal">
              {token} · {spec}
            </code>
            <div data-slot={`container-${token}`} className={cn('h-3 w-full rounded-full bg-brand', className)} />
          </li>
        ))}
      </ul>

      <Heading>Type ladder</Heading>
      <ul className="flex flex-col gap-3">
        {LADDER.map(({ step, spec, className, sample }) => (
          <li key={step} className="grid gap-x-4 gap-y-1 md:grid-cols-[280px_1fr] md:items-baseline">
            <code className="w-fit text-micro whitespace-normal">
              {step} · {spec}
            </code>
            <p data-slot={`ladder-${step}`} className={cn('m-0', className)}>
              {sample ?? 'Memes are the new trading cards'}
            </p>
          </li>
        ))}
      </ul>

      <Heading>Headings from the base layer</Heading>
      <div className="rounded-lg material-card p-card-inset">
        <h1>h1 is display</h1>
        <h2>h2 is title</h2>
        <h3>h3 is card-title</h3>
        <h4>h4 is card-title-phone</h4>
        <p>
          Body copy is Onest 16/24 on the foreground. A{' '}
          <a className="text-link underline underline-offset-3 decoration-1" href="#top">
            link
          </a>{' '}
          wears <code>--color-link</code>; inline <code>code</code> sits on the muted surface. 🧠 2,480 · 👁️ 12 · 🔁 3
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

/** A token's raw value on `:root`, as authored (a `light-dark()` pair stays a pair). */
const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** The arm of a `light-dark(<light>, <dark>)` value, or the value itself when it does not flip. */
function arm(value: string, which: 'light' | 'dark'): string {
  if (!value.startsWith('light-dark(')) return value
  const inner = value.slice('light-dark('.length, -1)
  let depth = 0
  for (let i = 0; i < inner.length; i += 1) {
    if (inner[i] === '(') depth += 1
    else if (inner[i] === ')') depth -= 1
    else if (inner[i] === ',' && depth === 0) {
      return (which === 'light' ? inner.slice(0, i) : inner.slice(i + 1)).trim()
    }
  }
  throw new Error(`${value} is not a light-dark() pair`)
}

/** What the browser makes of a CSS value for `property`, resolved in the document: the same serialisation a swatch gets. */
function resolved(property: 'backgroundColor' | 'boxShadow' | 'letterSpacing', value: string, fontSize?: string): string {
  const probe = document.createElement('span')
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  if (fontSize) probe.style.fontSize = fontSize
  probe.style[property] = value
  document.body.append(probe)
  const out = getComputedStyle(probe)[property]
  probe.remove()
  return out
}

const slot = <T extends HTMLElement>(name: string) => document.documentElement.querySelector<T>(`[data-slot="${name}"]`)!

/** Every swatch, material, step and role, compared with the token it names. */
async function assertTokensPainted(which: 'light' | 'dark') {
  const root = document.documentElement
  await expect(root.dataset.theme).toBe(which)
  await expect(getComputedStyle(root).colorScheme).toBe(which)

  for (const name of ['background', 'card', 'accent', 'muted', 'primary', 'brand', 'link', 'braincell', 'destructive']) {
    const expected = resolved('backgroundColor', arm(token(`--color-${name}`), which))
    await expect(getComputedStyle(slot(`swatch-${name}`)).backgroundColor).toBe(expected)
  }

  for (const [name, shadow] of [['raised', '--shadow-raised'], ['pressed', '--shadow-pressed'], ['pop', '--shadow-pop'], ['modal', '--shadow-modal']] as const) {
    await expect(getComputedStyle(slot(`material-${name}`)).boxShadow).toBe(resolved('boxShadow', token(shadow)))
  }
  await expect(getComputedStyle(slot('material-card')).backgroundColor).toBe(resolved('backgroundColor', arm(token('--color-card'), which)))
  await expect(getComputedStyle(slot('material-raised')).backgroundColor).toBe(resolved('backgroundColor', arm(token('--color-accent'), which)))
  await expect(getComputedStyle(slot('material-pressed')).backgroundColor).toBe(resolved('backgroundColor', arm(token('--color-muted'), which)))
  await expect(getComputedStyle(slot('material-primary')).backgroundColor).toBe(resolved('backgroundColor', arm(token('--color-primary'), which)))
  await expect(getComputedStyle(slot('material-disabled')).opacity).toBe(token('--opacity-disabled'))

  for (const step of ['xs', 'sm', 'md', 'lg', 'xl']) {
    await expect(getComputedStyle(slot(`radius-${step}`)).borderRadius).toBe(token(`--radius-${step}`))
  }
  for (const role of ['halo', 'track', 'gutter', 'page-x', 'icon', 'card-inset', 'bloom', 'control-sm', 'hit', 'control']) {
    await expect(getComputedStyle(slot(`spacing-${role}`)).width).toBe(token(`--spacing-${role}`))
  }
  for (const name of ['card-narrow', 'tabbar', 'search', 'card']) {
    await expect(getComputedStyle(slot(`container-${name}`)).maxWidth).toBe(token(`--container-${name}`))
  }

  for (const step of ['display', 'title', 'card-title', 'body', 'label', 'micro']) {
    const style = getComputedStyle(slot(`ladder-${step}`))
    await expect(style.fontSize).toBe(token(`--text-${step}`))
    await expect(style.lineHeight).toBe(token(`--text-${step}--line-height`))
  }
  for (const step of ['glyph-sm', 'glyph', 'glyph-lg', 'glyph-hero']) {
    const style = getComputedStyle(slot(`ladder-${step}`))
    const size = parseFloat(token(`--text-${step}`))
    await expect(style.fontSize).toBe(`${size}px`)
    await expect(parseFloat(style.lineHeight)).toBeCloseTo(size * parseFloat(token(`--text-${step}--line-height`)), 3)
  }
  const display = getComputedStyle(slot('ladder-display'))
  await expect(display.letterSpacing).toBe(resolved('letterSpacing', token('--tracking-display'), token('--text-display')))
  await expect(display.fontFamily).toContain('Unbounded Variable')
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
