import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { apiFetch, post } from '../lib/api'
import { colors } from '../lib/theme'
import type { Meme, Trade, TradeSide } from '../lib/types'

const STATUS: Record<Trade['status'], string> = {
  proposed: '⏳ proposed',
  accepted: '✅ accepted',
  declined: '❌ declined',
  cancelled: '🚫 cancelled',
}

const nameCache = new Map<string, string>()

export default function TradesScreen() {
  const { user, refresh } = useAuth()
  const [trades, setTrades] = useState<Trade[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(() => {
    apiFetch<{ trades: Trade[] }>('/api/trades')
      .then((r) => setTrades(r.trades))
      .catch(() => setTrades([]))
  }, [])

  useEffect(load, [load])

  const respond = async (trade: Trade, action: 'accept' | 'decline' | 'cancel') => {
    setErr(null)
    try {
      await post(`/api/trades/${trade.id}/respond`, { action })
      load()
      void refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'action failed')
    }
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 14, gap: 10 }}
      data={trades ?? []}
      keyExtractor={(t) => t.id}
      ListHeaderComponent={err ? <Text style={{ color: colors.danger }}>{err}</Text> : null}
      renderItem={({ item }) => {
        const mine = item.fromId === user?.sub
        return (
          <View style={styles.card}>
            <View style={styles.head}>
              <Text style={styles.who}>
                {item.fromName} ⇄ {item.toName}
              </Text>
              <Text style={styles.status}>{STATUS[item.status]}</Text>
            </View>
            <SideLine label={`${item.fromName} gives`} side={item.offer} />
            <SideLine label={`${item.toName} gives`} side={item.ask} />
            {item.status === 'proposed' && (
              <View style={styles.actions}>
                {mine ? (
                  <Btn label="Cancel" danger onPress={() => respond(item, 'cancel')} />
                ) : (
                  <>
                    <Btn label="Accept" onPress={() => respond(item, 'accept')} />
                    <Btn label="Decline" danger onPress={() => respond(item, 'decline')} />
                  </>
                )}
              </View>
            )}
          </View>
        )
      }}
      ListEmptyComponent={
        trades === null ? null : (
          <Text style={styles.empty}>No trades yet. Swipe right on something spicy. 📈</Text>
        )
      }
    />
  )
}

function SideLine({ label, side }: { label: string; side: TradeSide }) {
  return (
    <View style={{ marginTop: 6 }}>
      <Text style={styles.sideLabel}>{label}</Text>
      {side.memes.map((m) => (
        <Text key={m.memeId} style={styles.sideText}>
          • {m.shares} shares of <MemeName id={m.memeId} />
        </Text>
      ))}
      {side.coins > 0 && <Text style={styles.sideText}>• 🧠 {side.coins.toLocaleString()}</Text>}
      {side.memes.length === 0 && side.coins === 0 && <Text style={styles.sideText}>• nothing 😶</Text>}
    </View>
  )
}

function MemeName({ id }: { id: string }) {
  const [name, setName] = useState(nameCache.get(id) ?? `${id.slice(0, 8)}…`)
  useEffect(() => {
    if (nameCache.has(id)) return
    apiFetch<{ meme: Meme }>(`/api/memes/${id}`)
      .then((r) => {
        nameCache.set(id, r.meme.title)
        setName(r.meme.title)
      })
      .catch(() => {})
  }, [id])
  return <Text style={{ fontStyle: 'italic' }}>"{name}"</Text>
}

function Btn({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable style={[styles.btn, danger && styles.btnDanger]} onPress={onPress}>
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  who: { color: colors.text, fontWeight: '700', fontSize: 15 },
  status: { color: colors.dim, fontSize: 12.5, fontWeight: '700' },
  sideLabel: {
    color: colors.dim,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sideText: { color: colors.text, fontSize: 13.5, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: {
    backgroundColor: '#2c7fd8',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  btnDanger: { backgroundColor: '#5b2733' },
  btnText: { color: '#fff', fontWeight: '700' },
  empty: { color: colors.dim, textAlign: 'center', padding: 40, fontSize: 15 },
})
