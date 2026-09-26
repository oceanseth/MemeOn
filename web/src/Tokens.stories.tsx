import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { cn } from './lib/cn'
import { Icon, type IconName } from './atoms/icon'
import '@/atoms/foil.css'

/**
 * The token sheet: every colour role, the tier chips and frames, the materials, the radius steps,
 * the container cuts, the layout shorthands, the breakpoints and the type scale, painted with
 * nothing but what `index.css` emits. It is the visual reference — if a token looks wrong here it
 * is wrong everywhere — and a probe: each specimen carries a `data-slot` (`swatch-<token>`,
 * `radius-<step>`, `container-<name>`, `breakpoint-<name>`, `ladder-<step>`,
 * `glyph-<step>`, `heading-<level>`, `material-<name>`) and the play functions compare its
 * computed style with the token read back from `:root`, never with a literal. The spec beside a
 * type specimen is read from the same tokens, so the sheet cannot describe a scale it is not
 * painting.
 */

/** A token's raw value on `:root`, as authored (a `light-dark()` pair stays a pair). */
const token = (name: string) =>
  typeof document === 'undefined'
    ? ''
    : getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** The same token as a number (the `--text-*` steps end in px), so the Icon sample can match it. */
const tokenPx = (name: string) => {
  const value = parseFloat(token(name))
  return Number.isFinite(value) ? value : 22
}

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
  {
    token: 'destructive',
    bg: 'bg-destructive',
    text: 'text-destructive-foreground',
  },
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
  {
    key: 'paper',
    label: 'Paper',
    chip: 'bg-tier-paper-chip text-tier-paper-chip-text',
  },
  {
    key: 'silver',
    label: 'Silver',
    chip: 'bg-tier-silver-chip text-tier-silver-chip-text',
  },
  {
    key: 'holo',
    label: 'Holo',
    chip: 'bg-tier-holo-chip text-tier-holo-chip-text',
  },
  {
    key: 'chrome',
    label: 'Chrome',
    chip: 'bg-tier-chrome-chip text-tier-chrome-chip-text',
  },
  {
    key: 'gold',
    label: 'Gold',
    chip: 'bg-tier-gold-chip text-tier-gold-chip-text',
  },
  {
    key: 'prismatic',
    label: 'Prismatic',
    chip: 'bg-tier-prismatic-chip bg-(image:--gradient-tier-prismatic-chip) text-tier-prismatic-chip-text',
  },
  {
    key: 'shiny',
    label: 'Shiny',
    chip: 'bg-tier-shiny-chip text-tier-shiny-chip-text',
  },
]

/** The materials, each painted by its utility and nothing else. */
const MATERIALS: ReadonlyArray<{
  name: string
  className: string
  label: string
}> = [
  { name: 'card', className: 'material-card', label: 'material-card' },
  { name: 'raised', className: 'material-raised', label: 'material-raised' },
  { name: 'pressed', className: 'material-pressed', label: 'material-pressed' },
  { name: 'pop', className: 'material-pop', label: 'material-pop' },
  { name: 'modal', className: 'material-modal', label: 'material-modal' },
  { name: 'glass', className: 'glass', label: 'glass' },
  {
    name: 'primary',
    className: 'material-raised bg-primary text-primary-foreground',
    label: 'raised · primary',
  },
  {
    name: 'brand',
    className: 'material-raised bg-brand text-brand-foreground',
    label: 'raised · brand',
  },
  {
    name: 'danger',
    className: 'material-raised bg-error text-error-foreground',
    label: 'raised · danger',
  },
  {
    name: 'ring',
    className: 'material-raised outline-3 outline-offset-2 outline-ring',
    label: 'the ring',
  },
]

const RADII: ReadonlyArray<{ step: string; className: string }> = [
  { step: 'xs', className: 'rounded-xs' },
  { step: 'sm', className: 'rounded-sm' },
  { step: 'md', className: 'rounded-md' },
  { step: 'lg', className: 'rounded-lg' },
  { step: 'xl', className: 'rounded-xl' },
  { step: 'full', className: 'rounded-full' },
]

/* `@theme` `--container-*` cuts: a container-query plus the named max-w measures. */
const CONTAINERS: ReadonlyArray<{
  token: string
  spec: string
  className: string
}> = [
  {
    token: 'card-narrow',
    spec: '220px · a meme card too narrow for its meta row',
    className: 'max-w-card-narrow',
  },
  {
    token: 'prose',
    spec: '65ch · the measure',
    className: 'max-w-prose',
  },
  {
    token: 'notice',
    spec: '60ch · a notice',
    className: 'max-w-notice',
  },
  {
    token: 'aside',
    spec: '24ch · an aside',
    className: 'max-w-aside',
  },
]

/* The scale. `text-<step>` is a complete setting — size, line-height, letter-spacing and default
   weight all come from the step — so a specimen wears the size class and a family and nothing
   else, and its computed style is the token's own value. The text steps are Onest's; `xl` and
   above are the display steps and may wear Unbounded, never below it (20px is the display face's
   floor). A display step in Onest is allowed for one thing: a large numeral. */
const STEPS = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'] as const
type Step = (typeof STEPS)[number]

/** literal class names: the scanner has to see each one to emit it */
const STEP_CLASS: Record<Step, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
}

const STEP_ROLE: Record<Step, string> = {
  xs: 'chip, badge, tab label, stat line, eyebrow',
  sm: 'meta line, caption, secondary label, small button',
  base: 'body, button label, nav row, form label',
  lg: 'intro, lede, panel title, big stat',
  xl: 'meme card title, compact card title',
  '2xl': 'card and panel title, legal h2, footer wordmark',
  '3xl': 'dialog title, header wordmark, detail hero',
  '4xl': 'section heading, page title on the phone',
  '5xl': 'page title',
  '6xl': 'the landing hero',
}

/** `xl` and up wear Unbounded; below 20px the display face reads as a bold text face. */
const isDisplayStep = (step: Step) => STEPS.indexOf(step) >= STEPS.indexOf('xl')

/** The spec column, read from the same tokens the specimen beside it is painted with. */
function stepSpec(step: Step): string {
  const size = token(`--text-${step}`)
  const leading = token(`--text-${step}--line-height`)
  const tracking = token(`--text-${step}--letter-spacing`)
  const weight = token(`--text-${step}--font-weight`)
  const face = isDisplayStep(step) ? 'Unbounded' : 'Onest'
  return `${face} ${weight} · ${size}/${leading} · ${tracking}`
}

/** The Icon atom sits on four of the steps with `leading-none`; the size step is its sample. */
const GLYPHS: ReadonlyArray<{ step: Step; role: string; icon: IconName }> = [
  { step: 'base', role: 'a glyph in a 32px square', icon: 'palette' },
  { step: 'xl', role: 'a row or item glyph', icon: 'bell' },
  { step: '2xl', role: 'a podium medal', icon: 'medal' },
  { step: '6xl', role: 'an empty state, a pack opening', icon: 'gift' },
]

/* `--breakpoint-*`: six named cuts, no literals. Tailwind writes `bp:` as (width >= N) and
   `max-bp:` as (width < N). */
const BREAKPOINTS: ReadonlyArray<{ name: string; role: string }> = [
  { name: 'xs', role: 'discord link, alerts popover' },
  { name: 'sm', role: '2-up grids, leaderboard and person rows, login CTA' },
  { name: 'md', role: 'the phone cut: link status, filter bars, hero video' },
  { name: 'lg', role: 'bottom-sheet dialogs, market controls, quest scroller' },
  { name: 'xl', role: "the shell: the bar's links in, the tab bar out" },
  { name: '2xl', role: 'four-column tier grid, the create rail' },
]

function Heading({ children }: { children: string }) {
  return <h2 className="mt-8 mb-3 text-3xl">{children}</h2>
}

function Swatch({ token, bg, text }: { token: string; bg: string; text?: string }) {
  return (
    <li className="flex flex-col gap-1">
      <div
        data-slot={`swatch-${token}`}
        className={cn(
          'flex h-14 items-center justify-center rounded-sm border border-border text-xs',
          bg,
          text,
        )}
      >
        {text ? 'on it' : ''}
      </div>
      <code className="w-fit text-xs">{token}</code>
    </li>
  )
}

export function TokenSheet() {
  return (
    <div className="mx-auto max-w-360 bg-background p-6 text-foreground" data-slot="token-sheet">
      <h1 className="text-5xl">Tokens</h1>
      <p className="max-w-prose text-lg text-muted-foreground">
        Every colour below is a <code>light-dark()</code> pair; the theme toolbar flips{' '}
        <code>data-theme</code> on <code>&lt;html&gt;</code> and the browser picks the arm. Same
        markup, both arms.
      </p>

      <Heading>Colour roles</Heading>
      <ul className="grid grid-cols-(--grid-token-swatch) gap-3">
        {SEMANTIC.map((entry) => (
          <Swatch key={entry.token} {...entry} />
        ))}
      </ul>

      <Heading>Tier chips and frames</Heading>
      <ul className="flex flex-wrap gap-4">
        {TIERS.map((tier) => (
          <li key={tier.key} className="flex flex-col items-center gap-2">
            <div
              data-slot={`tier-frame-${tier.key}`}
              className={cn('foil-card rounded-md', `tier-${tier.key}`)}
            >
              <div className="foil-frame flex h-20 w-28 items-end rounded-md bg-muted p-2">
                <span
                  data-slot={`tier-chip-${tier.key}`}
                  className={cn('rounded-sm px-2 py-1 text-xs font-semibold', tier.chip)}
                >
                  {tier.label}
                </span>
              </div>
            </div>
            <code className="text-xs">{tier.key}</code>
          </li>
        ))}
      </ul>

      <Heading>Materials</Heading>
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-muted p-5">
        {MATERIALS.map(({ name, className, label }) => (
          <span
            key={name}
            data-slot={`material-${name}`}
            className={cn(
              'inline-flex h-11.5 items-center rounded-lg px-4.5 text-base font-semibold',
              className,
            )}
          >
            {label}
          </span>
        ))}
        <button
          type="button"
          disabled
          data-slot="material-disabled"
          className="disabled-look inline-flex h-11.5 items-center rounded-lg material-raised px-4.5 text-base font-semibold"
        >
          disabled-look
        </button>
        <span
          data-slot="material-field"
          className="inline-flex h-12.5 w-64 items-center rounded-md material-pressed px-4.5 text-base text-muted-foreground"
        >
          the field well
        </span>
      </div>

      <Heading>Radius steps</Heading>
      <ul className="flex flex-wrap gap-3">
        {RADII.map(({ step, className }) => (
          <li key={step} className="flex flex-col items-center gap-1">
            <div
              data-slot={`radius-${step}`}
              className={cn('h-16 w-24 border-3 border-border bg-card', className)}
            />
            <code className="text-xs">{className}</code>
          </li>
        ))}
      </ul>

      <Heading>Lengths</Heading>
      <p className="m-0 text-base text-muted-foreground">
        Lengths are grid steps — <code className="text-xs">p-4.5</code>,{' '}
        <code className="text-xs">h-11.5</code>, <code className="text-xs">max-w-140</code>. There
        are no role names.
      </p>

      <Heading>Containers</Heading>
      <ul className="flex flex-col gap-2 overflow-hidden">
        {CONTAINERS.map(({ token, spec, className }) => (
          <li key={token} className="flex flex-col gap-1">
            <code className="w-fit text-xs whitespace-normal">
              {token} · {spec}
            </code>
            <div
              data-slot={`container-${token}`}
              className={cn('h-3 w-full rounded-full bg-brand', className)}
            />
          </li>
        ))}
      </ul>

      <Heading>Layout</Heading>
      <div className="flex flex-col gap-3">
        <p className="max-w-prose m-0 text-sm text-muted-foreground">max-w-prose</p>
        <p className="max-w-notice m-0 text-sm text-muted-foreground">max-w-notice</p>
        <p className="max-w-aside m-0 text-sm text-muted-foreground">max-w-aside</p>
        <div
          className={cn(
            'max-h-(--dialog-max-h) max-w-(--dialog-max-w-sm) overflow-auto rounded-md',
            'material-card p-3 text-sm',
          )}
        >
          dialog-max-h · dialog-max-w-sm
        </div>
        <div className="max-w-(--dialog-max-w-md) overflow-auto rounded-md material-card p-3 text-sm">
          dialog-max-w-md
        </div>
        <div className="max-h-(--alerts-max-h) overflow-auto rounded-md material-card p-3 text-sm">
          alerts-max-h
        </div>
        <div className="w-(--header-popover-w) rounded-md material-pop p-3 text-sm">
          header-popover-w
        </div>
        <div className="relative h-32">
          <div
            className={cn(
              'absolute top-(--topbar-dock) z-(--z-skip) rounded-md material-raised',
              'px-3 py-1 text-xs',
            )}
          >
            z-skip · topbar-dock
          </div>
        </div>
        <div className="grid grid-cols-(--grid-binder) gap-1">
          <span className="h-6 rounded-xs bg-brand" />
          <span className="h-6 rounded-xs bg-brand" />
        </div>
        <div className="grid grid-cols-(--grid-giphy) gap-1">
          <span className="h-6 rounded-xs bg-brand" />
          <span className="h-6 rounded-xs bg-brand" />
        </div>
        <div className="grid grid-cols-(--grid-quest) gap-1">
          <span className="h-6 rounded-xs bg-brand" />
          <span className="h-6 rounded-xs bg-brand" />
        </div>
        <div className="grid grid-cols-(--grid-memeplex) gap-1">
          <span className="h-6 rounded-xs bg-brand" />
          <span className="h-6 rounded-xs bg-brand" />
        </div>
        <div className="grid grid-cols-(--grid-token-swatch) gap-1">
          <span className="h-6 rounded-xs bg-brand" />
          <span className="h-6 rounded-xs bg-brand" />
        </div>
        <div className="grid grid-cols-(--grid-detail) gap-1">
          <span className="h-6 rounded-xs bg-brand" />
          <span className="h-6 rounded-xs bg-muted" />
        </div>
        <div className="grid grid-cols-(--grid-create) gap-1">
          <span className="h-6 rounded-xs bg-brand" />
          <span className="h-6 rounded-xs bg-muted" />
        </div>
        <div className="grid grid-cols-(--grid-trade) gap-1">
          <span className="h-6 rounded-xs bg-brand" />
          <span className="h-6 rounded-xs bg-muted" />
          <span className="h-6 rounded-xs bg-brand" />
        </div>
        <div className="grid grid-cols-(--grid-card-action) grid-rows-(--grid-card-rows) gap-1">
          <span className="h-6 rounded-xs bg-brand" />
          <span className="h-6 rounded-xs bg-muted" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex-(--flex-key-card) rounded-md material-card p-3 text-sm">
            flex-key-card
          </div>
        </div>
        <p
          // `text-never-zoom` is `@utility` (coarse-pointer font-size), not `--color-never-zoom`.
          // oxlint-disable-next-line shadcn/no-raw-colors
          className="m-0 text-sm text-never-zoom"
        >
          text-never-zoom
        </p>
      </div>

      <Heading>Breakpoints</Heading>
      <ul className="flex flex-col gap-1.5">
        {BREAKPOINTS.map(({ name, role }) => (
          <li
            key={name}
            data-slot={`breakpoint-${name}`}
            className="flex flex-wrap items-baseline gap-x-3"
          >
            <code className="w-24 shrink-0 text-xs">{name}</code>
            <code className="w-20 shrink-0 text-xs">
              {token(`--breakpoint-${name}`)}
            </code>
            <span className="min-w-0 text-sm text-muted-foreground">{role}</span>
          </li>
        ))}
      </ul>

      <Heading>Type scale</Heading>
      <ul className="flex flex-col gap-4">
        {STEPS.map((step) => (
          <li
            key={step}
            className="grid gap-x-4 gap-y-1 md:grid-cols-(--grid-token-spec) md:items-baseline"
          >
            <code data-slot={`ladder-row-spec-${step}`} className="w-fit text-xs whitespace-normal">
              {step} · {stepSpec(step)} · {STEP_ROLE[step]}
            </code>
            <div className="flex min-w-0 flex-col gap-1">
              {/* the specimen wears its size and a family and nothing else: weight and tracking
                  arrive from the step, which is what the play function then reads back */}
              <p
                data-slot={`ladder-${step}`}
                className={cn(
                  'm-0 truncate',
                  STEP_CLASS[step],
                  isDisplayStep(step) ? 'font-display' : 'font-sans',
                )}
              >
                Memes are the new trading cards
              </p>
              {isDisplayStep(step) ? (
                <p
                  data-slot={`ladder-numeral-${step}`}
                  className={cn('m-0 font-sans text-muted-foreground', STEP_CLASS[step])}
                >
                  2,480
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <Heading>Icons on the scale</Heading>
      <ul className="flex flex-col gap-3">
        {GLYPHS.map(({ step, role, icon }) => (
          <li
            key={step}
            className="grid gap-x-4 gap-y-1 md:grid-cols-(--grid-token-spec) md:items-baseline"
          >
            <code className="w-fit text-xs whitespace-normal">
              {step} + leading-none · {role}
            </code>
            {/* the size first: cn treats `text-<step>` and `leading-*` as one axis, later wins */}
            <p data-slot={`glyph-${step}`} className={cn('m-0', STEP_CLASS[step], 'leading-none')}>
              <Icon name={icon} size={tokenPx(`--text-${step}`)} />
            </p>
          </li>
        ))}
      </ul>

      <Heading>Numerals</Heading>
      <div className="rounded-lg material-card p-6" data-slot="numerals">
        <p className="m-0 text-lg" data-slot="numerals-a">
          1,111,111 · 0123456789
        </p>
        <p className="m-0 text-lg" data-slot="numerals-b">
          2,480,000 · 9876543210
        </p>
        <p className="m-0 mt-2 text-sm text-muted-foreground">
          <code>font-variant-numeric: proportional-nums</code> on <code>body</code>: Onest&apos;s
          tabular figures are all 0.672em wide against a 0.363em proportional 1, so a tabular count
          reads as &quot;1 0&quot;. Every number sets as one word; a column aligns on its right
          edge. Nothing wears <code>tabular-nums</code>.
        </p>
      </div>

      <Heading>Headings from the base layer</Heading>
      <div className="rounded-lg material-card p-6">
        <h1 data-slot="heading-h1">h1 is the 5xl step (4xl on a phone)</h1>
        <h2 data-slot="heading-h2">h2 is the 3xl step</h2>
        <h3 data-slot="heading-h3">h3 is the 2xl step (xl on a phone)</h3>
        <h4 data-slot="heading-h4">h4 is Onest 600 at lg — below the display face&rsquo;s floor</h4>
        <p>
          Body copy is Onest 16/24 on the foreground. A{' '}
          <a className="text-link underline underline-offset-3 decoration-1" href="#top">
            link
          </a>{' '}
          wears <code>--color-link</code>; inline <code>code</code> sits on the muted surface.{' '}
          <span className="inline-flex items-center gap-1.5">
            <Icon name="brain" size={16} /> 2,480 · <Icon name="eye" size={16} /> 12 ·{' '}
            <Icon name="arrows-left-right" size={16} /> 3
          </span>
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
function resolved(
  property: 'backgroundColor' | 'boxShadow' | 'letterSpacing' | 'maxWidth',
  value: string,
  fontSize?: string,
): string {
  const probe = document.createElement('span')
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  if (property === 'maxWidth') {
    const body = getComputedStyle(document.body)
    probe.style.fontFamily = body.fontFamily
    probe.style.fontSize = fontSize ?? body.fontSize
  } else if (fontSize) {
    probe.style.fontSize = fontSize
  }
  probe.style[property] = value
  document.body.append(probe)
  const out = getComputedStyle(probe)[property]
  probe.remove()
  return out
}

const slot = <T extends HTMLElement>(name: string) =>
  document.documentElement.querySelector<T>(`[data-slot="${name}"]`)!

/** Every swatch, material, step and role, compared with the token it names. */
async function assertTokensPainted(which: 'light' | 'dark') {
  const root = document.documentElement
  await expect(root.dataset.theme).toBe(which)
  await expect(getComputedStyle(root).colorScheme).toBe(which)

  for (const name of [
    'background',
    'card',
    'accent',
    'muted',
    'primary',
    'brand',
    'link',
    'braincell',
    'destructive',
  ]) {
    const expected = resolved('backgroundColor', arm(token(`--color-${name}`), which))
    await expect(getComputedStyle(slot(`swatch-${name}`)).backgroundColor).toBe(expected)
  }

  for (const [name, shadow] of [
    ['raised', '--shadow-raised'],
    ['pressed', '--shadow-pressed'],
    ['pop', '--shadow-pop'],
    ['modal', '--shadow-modal'],
  ] as const) {
    await expect(getComputedStyle(slot(`material-${name}`)).boxShadow).toBe(
      resolved('boxShadow', token(shadow)),
    )
  }
  await expect(getComputedStyle(slot('material-card')).backgroundColor).toBe(
    resolved('backgroundColor', arm(token('--color-card'), which)),
  )
  await expect(getComputedStyle(slot('material-raised')).backgroundColor).toBe(
    resolved('backgroundColor', arm(token('--color-accent'), which)),
  )
  await expect(getComputedStyle(slot('material-pressed')).backgroundColor).toBe(
    resolved('backgroundColor', arm(token('--color-muted'), which)),
  )
  await expect(getComputedStyle(slot('material-primary')).backgroundColor).toBe(
    resolved('backgroundColor', arm(token('--color-primary'), which)),
  )
  await expect(getComputedStyle(slot('material-disabled')).opacity).toBe(
    token('--opacity-disabled'),
  )

  for (const step of ['xs', 'sm', 'md', 'lg', 'xl']) {
    await expect(getComputedStyle(slot(`radius-${step}`)).borderRadius).toBe(
      token(`--radius-${step}`),
    )
  }
  for (const { token: name } of CONTAINERS) {
    await expect(getComputedStyle(slot(`container-${name}`)).maxWidth).toBe(
      resolved('maxWidth', token(`--container-${name}`)),
    )
  }

  for (const name of BREAKPOINTS) {
    const value = token(`--breakpoint-${name.name}`)
    await expect(value).toMatch(/^\d+px$/)
    await expect(slot(`breakpoint-${name.name}`).textContent).toContain(value)
  }

  /* every step, both of its faces where the scale allows a second one: a `text-<step>` class is a
     complete setting, so size, leading, tracking and the default weight are all the step's own */
  for (const step of STEPS) {
    const style = getComputedStyle(slot(`ladder-${step}`))
    await expect(style.fontSize).toBe(token(`--text-${step}`))
    await expect(style.lineHeight).toBe(token(`--text-${step}--line-height`))
    await expect(style.letterSpacing).toBe(
      resolved('letterSpacing', token(`--text-${step}--letter-spacing`), token(`--text-${step}`)),
    )
    await expect(style.fontWeight).toBe(token(`--text-${step}--font-weight`))
    await expect(style.fontFamily).toContain(
      isDisplayStep(step) ? 'Unbounded Variable' : 'Onest Variable',
    )
    /* the spec column is read from the same tokens, so it can never describe a different scale */
    await expect(slot(`ladder-row-spec-${step}`).textContent).toContain(token(`--text-${step}`))
    if (isDisplayStep(step)) {
      const numeral = getComputedStyle(slot(`ladder-numeral-${step}`))
      await expect(numeral.fontSize).toBe(token(`--text-${step}`))
      await expect(numeral.fontFamily).toContain('Onest Variable')
    }
  }

  /* the display face has a floor: nothing under 20px is allowed to wear it */
  await expect(parseFloat(token('--text-xl'))).toBe(20)
  for (const step of ['xs', 'sm', 'base', 'lg'] as const) {
    await expect(parseFloat(token(`--text-${step}`))).toBeLessThan(parseFloat(token('--text-xl')))
  }

  for (const { step } of GLYPHS) {
    const style = getComputedStyle(slot(`glyph-${step}`))
    await expect(style.fontSize).toBe(token(`--text-${step}`))
    await expect(style.lineHeight).toBe(style.fontSize)
  }

  for (const [level, step] of [
    ['h1', '5xl'],
    ['h2', '3xl'],
    ['h3', '2xl'],
  ] as const) {
    const style = getComputedStyle(slot(`heading-${level}`))
    await expect(style.fontSize).toBe(token(`--text-${step}`))
    await expect(style.fontFamily).toContain('Unbounded Variable')
    await expect(style.fontWeight).toBe(token('--font-weight-display'))
  }
  const h4 = getComputedStyle(slot('heading-h4'))
  await expect(h4.fontSize).toBe(token('--text-lg'))
  await expect(h4.fontFamily).toContain('Onest Variable')
  await expect(h4.fontWeight).toBe(token('--font-weight-semibold'))

  /* figures are proportional: the line of ones is narrower than the line of eights and nines,
     which is the tell that no tabular set is in force */
  await expect(getComputedStyle(slot('numerals')).fontVariantNumeric).toContain('proportional-nums')
  const inkWidth = (el: Element) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    return range.getBoundingClientRect().width
  }
  await expect(inkWidth(slot('numerals-a'))).toBeLessThan(inkWidth(slot('numerals-b')))

  await document.fonts.ready
  await expect(document.fonts.check("400 16px 'Unbounded Variable'")).toBe(true)
  await expect(document.fonts.check("500 16px 'Unbounded Variable'")).toBe(true)
  await expect(document.fonts.check("400 16px 'Onest Variable'")).toBe(true)
  await expect(document.fonts.check("600 16px 'Onest Variable'")).toBe(true)
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
