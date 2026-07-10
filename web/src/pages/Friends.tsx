import { useCallback, useEffect, useState } from 'react'
import { apiFetch, post } from '../lib/api'
import { watchPresence } from '../lib/presence'
import { GiftDialog } from '../components/GiftDialog'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { FriendEntry } from '../lib/types'

interface UserHit {
  sub: string
  name: string
  picture: string | null
}

export default function Friends() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<FriendEntry[] | null>(null)
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<UserHit[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [online, setOnline] = useState<Set<string>>(new Set())
  const [gifting, setGifting] = useState<{ sub: string; name: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => watchPresence(setOnline), [])

  const inviteLink = user ? `${window.location.origin}/invite/${encodeURIComponent(user.sub)}` : ''

  const copyInvite = async () => {
    if (!inviteLink) return
    if (navigator.share) {
      await navigator
        .share({
          title: 'Join me on MemeOn',
          text: 'Memes are the new trading cards — join me on MemeOn!',
          url: inviteLink,
        })
        .catch(() => {})
      return
    }
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const load = useCallback(() => {
    apiFetch<{ friends: FriendEntry[] }>('/api/friends')
      .then((r) => setFriends(r.friends))
      .catch(() => setFriends([]))
  }, [])

  useEffect(load, [load])

  useEffect(() => {
    if (!q.trim()) {
      setHits([])
      return
    }
    const t = setTimeout(() => {
      apiFetch<{ users: UserHit[] }>(`/api/users?q=${encodeURIComponent(q)}`)
        .then((r) => setHits(r.users))
        .catch(() => setHits([]))
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  const request = async (userId: string) => {
    setMsg(null)
    try {
      await post('/api/friends/request', { userId })
      setMsg('Friend request sent 👋')
      setQ('')
      load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'request failed')
    }
  }

  const respond = async (userId: string, accept: boolean) => {
    await post('/api/friends/respond', { userId, accept }).catch(() => {})
    load()
  }

  const remove = async (userId: string) => {
    await post('/api/friends/remove', { userId }).catch(() => {})
    load()
  }

  const incoming = friends?.filter((f) => f.status === 'incoming') ?? []
  const outgoing = friends?.filter((f) => f.status === 'outgoing') ?? []
  const accepted = friends?.filter((f) => f.status === 'accepted') ?? []

  return (
    <main className="container">
      <div className="page-head">
        <h2>Friends</h2>
        <div className="filter-bar">
          <input
            type="search"
            placeholder="Find people by name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="primary" onClick={copyInvite}>
            {copied ? 'Invite link copied ✓' : '💌 Invite a friend'}
          </button>
        </div>
      </div>

      {msg && <p className="notice ok">{msg}</p>}

      {(() => {
        const onlineFriends = (friends ?? []).filter(
          (f) => f.status === 'accepted' && online.has(f.sub),
        )
        return onlineFriends.length > 0 ? (
          <div className="panel online-strip" style={{ marginBottom: 20 }}>
            <span className="online-dot" /> Online now
            <div className="online-avatars">
              {onlineFriends.map((f) => (
                <Link key={f.sub} to={`/u/${encodeURIComponent(f.sub)}`} className="online-friend" title={f.name}>
                  {f.picture ? <img className="avatar" src={f.picture} alt={f.name} /> : null}
                  <span>{f.name}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null
      })()}

      {hits.length > 0 && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="row-list">
            {hits.map((u) => (
              <div className="person-row" key={u.sub}>
                <Link to={`/u/${encodeURIComponent(u.sub)}`} className="person-link">
                  {u.picture && <img className="avatar" src={u.picture} alt="" />}
                  <span className="person-name">{u.name}</span>
                </Link>
                <span className="spacer" />
                <button className="primary" onClick={() => request(u.sub)}>
                  Add friend
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {incoming.length > 0 && (
        <>
          <h3>Requests for you</h3>
          <div className="row-list" style={{ marginBottom: 22 }}>
            {incoming.map((f) => (
              <div className="person-row" key={f.sub}>
                <Link to={`/u/${encodeURIComponent(f.sub)}`} className="person-link">
                  {f.picture && <img className="avatar" src={f.picture} alt="" />}
                  <span className="person-name">{f.name}</span>
                </Link>
                <span className="spacer" />
                <button className="primary" onClick={() => respond(f.sub, true)}>
                  Accept
                </button>
                <button className="danger" onClick={() => respond(f.sub, false)}>
                  Decline
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {friends === null ? (
        <div className="empty">
          <span className="spin" />
        </div>
      ) : accepted.length === 0 && incoming.length === 0 && outgoing.length === 0 ? (
        <div className="empty">No friends yet. Search above and build your trading circle.</div>
      ) : (
        <>
          <h3>Your circle</h3>
          <div className="row-list">
            {accepted.map((f) => (
              <div className="person-row" key={f.sub}>
                <Link to={`/u/${encodeURIComponent(f.sub)}`} className="person-link">
                  {f.picture && <img className="avatar" src={f.picture} alt="" />}
                  <div>
                    <div className="person-name">
                      {f.name}
                      {online.has(f.sub) && <span className="online-dot" title="online" />}
                    </div>
                    <div className="person-stats">
                      📚 {f.collectionSize} memes · 🧠 {f.portfolioValue.toLocaleString()} portfolio
                    </div>
                  </div>
                </Link>
                <span className="spacer" />
                <button title="Gift shares" onClick={() => setGifting({ sub: f.sub, name: f.name })}>
                  🎁
                </button>
                <button className="danger" onClick={() => remove(f.sub)}>
                  Remove
                </button>
              </div>
            ))}
            {outgoing.map((f) => (
              <div className="person-row" key={f.sub} style={{ opacity: 0.65 }}>
                <Link to={`/u/${encodeURIComponent(f.sub)}`} className="person-link">
                  {f.picture && <img className="avatar" src={f.picture} alt="" />}
                  <span className="person-name">{f.name}</span>
                </Link>
                <span className="badge">pending</span>
                <span className="spacer" />
                <button onClick={() => remove(f.sub)}>Cancel</button>
              </div>
            ))}
          </div>
        </>
      )}
      <GiftDialog
        open={!!gifting}
        recipient={gifting}
        onClose={() => setGifting(null)}
        onGifted={(m) => setMsg(m)}
      />
    </main>
  )
}
