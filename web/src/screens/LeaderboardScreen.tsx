import { Link } from 'react-router-dom'
import type { LeaderboardScreenModel } from '../hooks/useLeaderboardScreen'

const MEDALS = ['🥇', '🥈', '🥉']

/** Top Brains as a function of its model. Every engine state is one set of args. */
export function LeaderboardScreen({
  leaders,
  showLoading,
  showEmpty,
  emptyMessage,
  showList,
}: LeaderboardScreenModel) {
  return (
    <main className="container">
      <div className="page-head">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          🏆 Top Brains
          <img className="braincell-img" src="/api/brand/braincell.png" alt="" style={{ width: 34, height: 34 }} />
        </h2>
        <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          The ten wrinkliest braincell holders on MemeOn
        </span>
      </div>

      {showLoading ? (
        <div className="empty">
          <span className="spin" />
        </div>
      ) : showEmpty ? (
        <div className="empty">{emptyMessage}</div>
      ) : showList ? (
        <div className="row-list">
          {leaders.map((l, i) => (
            <Link key={l.sub} to={`/u/${encodeURIComponent(l.sub)}`} className="person-row leader-row">
              <span className="leader-rank">{MEDALS[i] ?? `#${i + 1}`}</span>
              {l.picture && <img className="avatar" src={l.picture} alt="" />}
              <div>
                <div className="person-name">{l.name}</div>
                <div className="person-stats">
                  📚 {l.collectionSize} memes · portfolio 🧠 {l.portfolioValue.toLocaleString()}
                </div>
              </div>
              <span className="spacer" />
              <span className="leader-cells">🧠 {l.braincells.toLocaleString()}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </main>
  )
}
