import { Link } from 'react-router-dom'
import { tierClasses } from '../atoms/MemeCard'
import type { LandingScreenModel } from '../hooks/useLandingScreen'

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
    <main className="container" id="main" tabIndex={-1}>
      <section className="hero">
        <h1>
          Memes are the new <span className="grad">trading cards</span>
        </h1>
        <p>
          Mint your memes, watch them climb the virality tiers as they get reshared, and trade
          positions with friends. Every meme gets a share link whose card frame levels up as it
          spreads.
        </p>
        {hero}
        {showMarketplaceCta ? (
          <Link className="btn primary login-btn" to="/marketplace">
            📈 Enter the marketplace
          </Link>
        ) : showLoginButton ? (
          <>
            <button className="primary login-btn" {...loginButtonProps}>
              {loginLabel}
            </button>
            <p className="muted login-reassure">No email. No real name. Just your Masky avatar.</p>
          </>
        ) : null}
        {showErr && <p className="notice error" {...errorNoticeProps}>{err}</p>}
      </section>

      <h2 className="section-title" id="tiers">
        The Virality Tiers
      </h2>
      <p className="section-sub">
        Views power everything. Share a meme's link anywhere — every load of that link counts — and
        its card physically transforms as it ascends.
      </p>
      {/* an ordered climb, so the ladder is an <ol>: the sequence is the section's argument */}
      <ol className="tier-grid">
        {tiers.map((t) => (
          <li
            key={t.key}
            className={`tier-card ${tierClasses(t.key)}`}
            data-glow-style={t.glowStyle}
          >
            <div className="tier-card-inner">
              {/* the slot is permanent, so loading, ready and failed all keep the same box */}
              <div className="foil-media">
                <div className="tier-frame-slot" {...frameSlotProps[t.key]}>
                  {frameImageProps[t.key] ? (
                    <img
                      className="tier-frame-img"
                      {...frameImageProps[t.key]}
                    />
                  ) : null}
                </div>
              </div>
              <h3 className="tier-name" style={{ color: t.color }}>
                {t.name}
              </h3>
              <span className="tier-req">
                {t.requirementLabel}
              </span>
              <span className="tier-hype">{t.hype}</span>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="section-title">FAQ</h2>
      <div className="faq">
        <details open>
          <summary><h3 className="faq-q">WTF is MemeOn?</h3></summary>
          <p>
            A meme trading card market. You mint memes (upload or generate them with your Masky
            credits), each one becomes a 100-share collectible card, and its rarity tier is driven
            by real views of its unique link.
          </p>
        </details>
        <details>
          <summary><h3 className="faq-q">How do tiers work?</h3></summary>
          <p>
            Every meme has a share URL (memeon.ai/m/…). Each time that link is loaded — a friend
            clicks it, Discord unfurls it, a bot scrapes it — the view counter ticks up (and every
            new place it's shared is counted separately as a reshare). Cross a view
            threshold and the meme tiers up: Paper → Silver → Holo → Chrome → Gold → Prismatic →
            ✨Shiny✨. The link preview card (the og image) upgrades its foil frame automatically,
            so a Gold meme flexes gold wherever it's shared.
          </p>
        </details>
        <details>
          <summary><h3 className="faq-q">What are braincells? 🧠</h3></summary>
          <img
            className="braincell-img lg"
            src="/api/brand/braincell.png"
            alt="a braincell"
          />
          <p>
            Braincells are MemeOn's currency — you buy meme shares, fund trades, and flex on the
            🏆 Top Brains leaderboard with them. Everyone starts at zero (smoothbrained, sorry) and
            earns their first braincells through the onboarding quests: claim your free starter
            pack, mint your first meme, get your first reshare, make a friend, close a trade. AI
            generation is separate — that runs on your own Masky credits.
          </p>
        </details>
        <details>
          <summary><h3 className="faq-q">How do I invest in a meme?</h3></summary>
          <p>
            Memes are split into 100 shares. Holders can list shares at a price in braincells 🧠;
            you can buy from the Marketplace, or propose direct trades (shares + braincells for
            shares + braincells) with friends. When your meme sells or tiers up, you get an alert.
          </p>
        </details>
        <details>
          <summary><h3 className="faq-q">What's Masky got to do with it?</h3></summary>
          <p>
            Login is "Sign in with Masky" — your Masky avatar is your identity here, and meme
            generation (images and videos) runs on your own Masky credits. Your real identity
            stays protected: MemeOn only ever sees your avatar, never who's behind the mask. And
            your avatar can do more than represent you — configure an agentic harness for it on
            Masky and it runs as an agent on your behalf: auto-approving or proposing trades,
            minting new memes with AI, watching for memes catching reshare momentum, and generally
            maximizing your braincells while you sleep.
          </p>
        </details>
      </div>

      {/* the FAQ is where the page finishes convincing, so the CTA is there too */}
      {showMarketplaceCta || showLoginButton ? (
        <section className="landing-close">
          <p>{closingLine}</p>
          {showMarketplaceCta ? (
            <Link className="btn primary login-btn" to="/marketplace">
              📈 Enter the marketplace
            </Link>
          ) : (
            <button className="primary login-btn" {...closingLoginButtonProps}>
              {closingLoginLabel}
            </button>
          )}
        </section>
      ) : null}
    </main>
  )
}
