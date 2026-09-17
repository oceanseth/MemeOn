/** @file The share cards themselves. Layout and type only — every pixel comes from `theme.ts`. */
import { TIERS, memeValue, tierFor } from '@memeon/shared/tiers'
import type { Tier } from '@memeon/shared/tiers'
import { FAMILY_DISPLAY, FAMILY_SANS } from './fonts'
import { h, Fragment, type OgNode } from './jsx'
import { COLOR, RADIUS, foilFor } from './theme'
import { OG_SIZE } from './render'

// h and Fragment are what the JSX below compiles to (see tsconfig `jsxFactory`).
void h
void Fragment

const { width: W, height: H } = OG_SIZE
const PAD = 64
const GAP = 56
/** The meme keeps a 3:4 trading-card portrait; the copy takes what is left of the row. */
const CARD_H = H - PAD * 2
const CARD_W = Math.round((CARD_H * 3) / 4)
const COL_W = W - PAD * 2 - CARD_W - GAP

/** `#rrggbb` at an alpha — the `color-mix(… , transparent)` the tokens use, spelled for SVG. */
function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const fill = { position: 'absolute' as const, top: 0, left: 0, width: W, height: H, display: 'flex' }

/**
 * Depth, cheaply. resvg renders a `box-shadow` as a real gaussian over the filter region, and the
 * cost climbs super-linearly with the radius — an 80px shadow costs ~2s a card, a 40px one ~0.3s.
 * So a card gets one tight shadow for lift, and its tier's bloom is painted as a radial gradient
 * behind it instead, which is an ordinary fill and effectively free.
 */
const LIFT = '0 18px 44px rgba(0, 0, 0, 0.55)'
const LIFT_SM = '0 12px 28px rgba(0, 0, 0, 0.5)'

/** The art wash behind every card: the picture itself, blurred past recognition, then dimmed. */
function Backdrop({ art, bloom }: { art: string | null; bloom: string }): OgNode {
  return (
    <div style={{ ...fill }}>
      {art ? (
        <img
          src={art}
          style={{ ...fill, objectFit: 'cover', filter: 'blur(56px)', transform: 'scale(1.15)', opacity: 0.8 }}
        />
      ) : null}
      <div
        style={{
          ...fill,
          // darkest under the copy, lightest under the card, so the art still reads as this meme's
          backgroundImage: `linear-gradient(105deg, ${tint(COLOR.background, 0.88)} 0%, ${tint(COLOR.background, 0.76)} 38%, ${tint(COLOR.background, 0.96)} 72%, ${tint(COLOR.background, 0.97)} 100%)`,
        }}
      />
      <div style={{ ...fill, backgroundImage: `radial-gradient(circle at 24% 50%, ${bloom} 0%, transparent 46%)` }} />
    </div>
  )
}

/** The wordmark lockup, as the card's eyebrow. */
function Wordmark({ logo, size = 44 }: { logo: string | null; size?: number }): OgNode {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {logo ? <img src={logo} style={{ width: size, height: size, borderRadius: RADIUS.full }} /> : null}
      <div
        style={{
          fontFamily: FAMILY_DISPLAY,
          fontWeight: 500,
          fontSize: 24,
          letterSpacing: '0.16em',
          color: COLOR.brand,
        }}
      >
        MEMEON
      </div>
    </div>
  )
}

/** One number over its label. */
function Stat({ value, label, color }: { value: string; label: string; color?: string }): OgNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontFamily: FAMILY_SANS, fontWeight: 600, fontSize: 40, color: color ?? COLOR.foreground }}>
        {value}
      </div>
      <div
        style={{
          fontFamily: FAMILY_SANS,
          fontWeight: 500,
          fontSize: 15,
          letterSpacing: '0.14em',
          color: COLOR.mutedForeground,
        }}
      >
        {label}
      </div>
    </div>
  )
}

/** The rarity pill. Ink and edge are the tier's own colour, which is light in every tier. */
function TierChip({ tier }: { tier: Tier }): OgNode {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 12,
        padding: '10px 22px',
        borderRadius: RADIUS.full,
        border: `2px solid ${tint(tier.color, 0.55)}`,
        backgroundColor: tint(tier.color, 0.14),
        fontFamily: FAMILY_SANS,
        fontWeight: 600,
        fontSize: 20,
        letterSpacing: '0.12em',
        color: tier.color,
      }}
    >
      {`${tier.name.toUpperCase()} · ${tier.rarity.toUpperCase()}`}
    </div>
  )
}

/** The meme in its foil frame — the same 3px ring the app draws, scaled to the card. */
function FoilCard({
  tier,
  art,
  play,
  width,
  height,
}: {
  tier: Tier
  art: string | null
  play: string | null
  width: number
  height: number
}): OgNode {
  const foil = foilFor(tier)
  const ring = 6
  return (
    <div
      style={{
        display: 'flex',
        width,
        height,
        padding: ring,
        borderRadius: RADIUS.md + ring,
        backgroundImage: foil.sweep,
        boxShadow: LIFT,
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: width - ring * 2,
          height: height - ring * 2,
          borderRadius: RADIUS.md,
          overflow: 'hidden',
          backgroundColor: COLOR.card,
        }}
      >
        {art ? <img src={art} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
        {play ? (
          <img
            src={play}
            style={{
              position: 'absolute',
              top: (height - ring * 2 - 132) / 2,
              left: (width - ring * 2 - 132) / 2,
              width: 132,
              height: 132,
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

/** A tier's foil strip along the bottom edge — the card's one flash of the ladder. */
function FoilEdge({ sweep }: { sweep: string }): OgNode {
  return <div style={{ position: 'absolute', bottom: 0, left: 0, width: W, height: 8, display: 'flex', backgroundImage: sweep }} />
}

/**
 * Unbounded is a wide face and a title is capped at 20 characters at mint, so three steps cover
 * the range: the short ones get the hero size, the long ones step down rather than wrap to three
 * lines. Sizes are the display steps in `web/src/index.css`, scaled to this canvas.
 */
function titleSize(title: string): number {
  if (title.length <= 12) return 64
  if (title.length <= 18) return 54
  return 46
}

export interface MemeCardProps {
  title: string
  reshares: number
  uniqueRefs: number
  /** the meme itself, inlined by `art.ts`; null renders the frame empty rather than failing */
  art: string | null
  logo: string | null
  /** the play badge, for memes whose media is a video */
  play: string | null
}

/**
 * A meme's share card: the meme in its foil frame on the left, what the frame means on the right.
 * The whole card reads at Slack's thumbnail size — the title and the rarity carry it.
 */
export function MemeCard({ title, reshares, uniqueRefs, art, logo, play }: MemeCardProps): OgNode {
  const tier = tierFor(reshares)
  const foil = foilFor(tier)
  return (
    <div style={{ display: 'flex', position: 'relative', width: W, height: H, backgroundColor: COLOR.background }}>
      <Backdrop art={art} bloom={foil.bloom} />
      <div style={{ display: 'flex', position: 'relative', width: W, height: H, padding: PAD, gap: GAP }}>
        <FoilCard tier={tier} art={art} play={play} width={CARD_W} height={CARD_H} />
        <div style={{ display: 'flex', flexDirection: 'column', width: COL_W, justifyContent: 'center', gap: 28 }}>
          <Wordmark logo={logo} />
          <div
            style={{
              fontFamily: FAMILY_DISPLAY,
              fontWeight: 500,
              fontSize: titleSize(title),
              lineHeight: 1.14,
              letterSpacing: '-0.03em',
              color: COLOR.foreground,
            }}
          >
            {title}
          </div>
          <TierChip tier={tier} />
          <div style={{ display: 'flex', gap: 52 }}>
            <Stat value={reshares.toLocaleString('en-US')} label="VIEWS" />
            <Stat value={uniqueRefs.toLocaleString('en-US')} label="RESHARES" />
            <Stat value={memeValue(reshares).toLocaleString('en-US')} label="BRAINCELLS" color={COLOR.braincell} />
          </div>
        </div>
      </div>
      <FoilEdge sweep={foil.sweep} />
    </div>
  )
}

/** The three tiers the home card fans out — the bottom, the middle and the top of the ladder. */
const LADDER = ['silver', 'gold', 'prismatic'] as const

/** One blank foil card, for the fan on the home card. */
function LadderCard({ tier, rotate, offset }: { tier: Tier; rotate: number; offset: number }): OgNode {
  const foil = foilFor(tier)
  return (
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        top: 96 + offset,
        left: 664 + offset * 2.6,
        width: 252,
        height: 336,
        padding: 6,
        borderRadius: RADIUS.md + 6,
        backgroundImage: foil.sweep,
        boxShadow: LIFT,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          width: 240,
          height: 324,
          padding: 20,
          borderRadius: RADIUS.md,
          backgroundImage: `linear-gradient(160deg, ${tint(tier.color, 0.22)} 0%, ${COLOR.card} 62%)`,
        }}
      >
        <div
          style={{
            fontFamily: FAMILY_SANS,
            fontWeight: 600,
            fontSize: 22,
            letterSpacing: '0.14em',
            color: tier.color,
          }}
        >
          {tier.name.toUpperCase()}
        </div>
      </div>
    </div>
  )
}

/**
 * The card for memeon.ai itself. Rendered at build time into `web/public/brand/og-home.png`
 * (`pnpm --filter memeon-api og:home`), because the site root is served from S3, not this lambda.
 */
export function HomeCard({ logo }: { logo: string | null }): OgNode {
  const fan = LADDER.map((key) => TIERS.find((t) => t.key === key)!)
  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: W,
        height: H,
        backgroundColor: COLOR.background,
        backgroundImage: `radial-gradient(circle at 12% 8%, ${tint(COLOR.ultraviolet700, 0.55)} 0%, transparent 52%), linear-gradient(150deg, ${COLOR.background} 34%, ${COLOR.card} 100%)`,
      }}
    >
      {fan.map((tier, i) => (
        <LadderCard tier={tier} rotate={-9 + i * 9} offset={i * 34} />
      ))}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 30,
          width: 690,
          height: H,
          padding: PAD,
        }}
      >
        <Wordmark logo={logo} size={52} />
        <div
          style={{
            fontFamily: FAMILY_DISPLAY,
            fontWeight: 500,
            fontSize: 62,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: COLOR.foreground,
          }}
        >
          Memes are the new trading cards.
        </div>
        <div style={{ fontFamily: FAMILY_SANS, fontWeight: 400, fontSize: 24, lineHeight: 1.45, color: COLOR.mutedForeground }}>
          Mint them, watch them climb foil rarity tiers as they get reshared, and invest in your
          friends' bangers before they go shiny.
        </div>
      </div>
      <FoilEdge sweep={foilFor(fan[2]).sweep} />
    </div>
  )
}

/** The person, as a ringed avatar. Falls back to the brand mark when they have no picture. */
function Avatar({ src, size, ring }: { src: string | null; size: number; ring: string }): OgNode {
  return (
    <div
      style={{
        display: 'flex',
        width: size,
        height: size,
        padding: 6,
        borderRadius: RADIUS.full,
        backgroundImage: ring,
        boxShadow: LIFT_SM,
      }}
    >
      <div
        style={{
          display: 'flex',
          width: size - 12,
          height: size - 12,
          borderRadius: RADIUS.full,
          overflow: 'hidden',
          backgroundColor: COLOR.card,
        }}
      >
        {src ? <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
      </div>
    </div>
  )
}

/** The brand's own ring — the ultraviolet companion, for surfaces that have no tier of their own. */
const BRAND_RING = `linear-gradient(120deg, ${COLOR.brand} 0%, ${COLOR.primary} 42%, ${COLOR.braincell} 74%, ${COLOR.brand} 100%)`
const BRAND_BLOOM = 'rgba(183, 182, 248, 0.32)'

export interface ProfileCardProps {
  name: string
  coins: number
  collectionSize: number
  avatar: string | null
  logo: string | null
}

/** A collector's share card: who they are and what they are holding. */
export function ProfileCard({ name, coins, collectionSize, avatar, logo }: ProfileCardProps): OgNode {
  return (
    <div style={{ display: 'flex', position: 'relative', width: W, height: H, backgroundColor: COLOR.background }}>
      <Backdrop art={avatar} bloom={BRAND_BLOOM} />
      <div
        style={{
          display: 'flex',
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'center',
          width: W,
          height: H,
          padding: PAD,
          gap: 40,
        }}
      >
        <Wordmark logo={logo} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 44 }}>
          <Avatar src={avatar} size={236} ring={BRAND_RING} />
          <div style={{ display: 'flex', flexDirection: 'column', width: 690, gap: 14 }}>
            <div
              style={{
                fontFamily: FAMILY_DISPLAY,
                fontWeight: 500,
                fontSize: titleSize(name),
                lineHeight: 1.14,
                letterSpacing: '-0.03em',
                color: COLOR.foreground,
              }}
            >
              {name}
            </div>
            <div style={{ fontFamily: FAMILY_SANS, fontWeight: 500, fontSize: 24, color: COLOR.mutedForeground }}>
              collects, trades and invests on MemeOn
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 60 }}>
          <Stat value={coins.toLocaleString('en-US')} label="BRAINCELLS" color={COLOR.braincell} />
          <Stat value={collectionSize.toLocaleString('en-US')} label="MEMES" />
        </div>
      </div>
      <FoilEdge sweep={BRAND_RING} />
    </div>
  )
}

/**
 * The binder page: three sleeves across, two down, on a 3:4 thumbnail. Yoga measures `width` as
 * the border box, so the spine's rule and its padding both come out of the row before it divides.
 */
const BINDER = { cols: 3, rows: 2, gap: 18, spine: 34, rule: 4, colW: 556 }
const SLEEVE_W = Math.floor(
  (BINDER.colW - BINDER.spine - BINDER.rule - BINDER.gap * (BINDER.cols - 1)) / BINDER.cols,
)
const SLEEVE_H = Math.round((SLEEVE_W * 4) / 3)

/** One sleeve in the binder page: a meme at thumbnail size, in its own tier's foil. */
function Sleeve({ meme }: { meme: BinderSleeve | undefined }): OgNode {
  const foil = meme ? foilFor(meme.tier) : null
  return (
    <div
      style={{
        display: 'flex',
        width: SLEEVE_W,
        height: SLEEVE_H,
        padding: 4,
        borderRadius: RADIUS.sm + 4,
        backgroundImage: foil?.sweep ?? `linear-gradient(120deg, ${COLOR.border} 0%, ${COLOR.border} 100%)`,
        opacity: meme ? 1 : 0.35,
      }}
    >
      <div
        style={{
          display: 'flex',
          width: SLEEVE_W - 8,
          height: SLEEVE_H - 8,
          borderRadius: RADIUS.sm,
          overflow: 'hidden',
          backgroundColor: COLOR.card,
        }}
      >
        {meme?.art ? <img src={meme.art} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
      </div>
    </div>
  )
}

export interface BinderSleeve {
  tier: Tier
  art: string | null
}

export interface BinderCardProps {
  name: string
  collectionSize: number
  value: number
  avatar: string | null
  logo: string | null
  /** highest-value cards first; the page always shows six slots, empty ones included */
  sleeves: BinderSleeve[]
}

/** A binder's share card: the collector on the left, their best six sleeved on the right. */
export function BinderCard({ name, collectionSize, value, avatar, logo, sleeves }: BinderCardProps): OgNode {
  const page = Array.from({ length: 6 }, (_, i) => sleeves[i])
  const top = sleeves[0]
  return (
    <div style={{ display: 'flex', position: 'relative', width: W, height: H, backgroundColor: COLOR.background }}>
      <Backdrop art={top?.art ?? avatar} bloom={top ? foilFor(top.tier).bloom : BRAND_BLOOM} />
      <div style={{ display: 'flex', position: 'relative', width: W, height: H, padding: PAD, gap: GAP }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: W - PAD * 2 - GAP - BINDER.colW,
            justifyContent: 'center',
            gap: 26,
          }}
        >
          <Wordmark logo={logo} />
          <Avatar src={avatar} size={124} ring={BRAND_RING} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                fontFamily: FAMILY_DISPLAY,
                fontWeight: 500,
                fontSize: 44,
                lineHeight: 1.14,
                letterSpacing: '-0.03em',
                color: COLOR.foreground,
              }}
            >
              {name}
            </div>
            <div style={{ fontFamily: FAMILY_SANS, fontWeight: 500, fontSize: 24, color: COLOR.mutedForeground }}>
              Meme Binder
            </div>
          </div>
          <div style={{ display: 'flex', gap: 52 }}>
            <Stat value={collectionSize.toLocaleString('en-US')} label="MEMES" />
            <Stat value={value.toLocaleString('en-US')} label="BRAINCELLS" color={COLOR.braincell} />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'center',
            width: BINDER.colW,
            height: CARD_H,
            gap: BINDER.gap,
            paddingLeft: BINDER.spine,
            // the binder's spine, down the page's left edge
            borderLeft: `${BINDER.rule}px solid ${COLOR.border}`,
          }}
        >
          {page.map((meme) => (
            <Sleeve meme={meme} />
          ))}
        </div>
      </div>
      <FoilEdge sweep={top ? foilFor(top.tier).sweep : BRAND_RING} />
    </div>
  )
}
