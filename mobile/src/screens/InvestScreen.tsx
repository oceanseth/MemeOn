import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import type { RootStackParamList } from '../../App'
import { FoilCard } from '../components/FoilCard'
import { MemeMedia } from '../components/MemeMedia'
import { ValueChart } from '../components/ValueChart'
import { useAuth } from '../context/AuthContext'
import { apiFetch, post } from '../lib/api'
import { colors } from '../lib/theme'
import type { HistoryPoint, Meme, Position } from '../lib/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Invest'>

export default function InvestScreen({ route, navigation }: Props) {
  const { memeId } = route.params
  const { user, refresh } = useAuth()
  const { width } = useWindowDimensions()
  const [meme, setMeme] = useState<Meme | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [binder, setBinder] = useState<(Meme & { myShares?: number })[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // buy from listing
  const [buyShares, setBuyShares] = useState('1')
  // buy offer (coins for shares)
  const [offerShares, setOfferShares] = useState('10')
  const [offerCoins, setOfferCoins] = useState('25')
  // trade offer
  const [tradeMemeId, setTradeMemeId] = useState('')
  const [tradeGiveShares, setTradeGiveShares] = useState('10')
  const [tradeWantShares, setTradeWantShares] = useState('10')

  const load = useCallback(() => {
    apiFetch<{ meme: Meme; positions: Position[] }>(`/api/memes/${memeId}`)
      .then((r) => {
        setMeme(r.meme)
        setPositions(r.positions)
        navigation.setOptions({ title: r.meme.title })
      })
      .catch(() => setErr('meme not found'))
    apiFetch<{ points: HistoryPoint[] }>(`/api/memes/${memeId}/history`)
      .then((r) => setHistory(r.points))
      .catch(() => {})
    apiFetch<{ memes: (Meme & { myShares?: number })[] }>('/api/binder')
      .then((r) => setBinder(r.memes.filter((m) => (m.myShares ?? 0) > 0 && m.id !== memeId)))
      .catch(() => {})
  }, [memeId, navigation])

  useEffect(load, [load])

  if (!meme) {
    return (
      <View style={styles.center}>
        {err ? <Text style={{ color: colors.danger }}>{err}</Text> : <ActivityIndicator color={colors.accent} />}
      </View>
    )
  }

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg(null)
    setErr(null)
    try {
      await fn()
      setMsg(ok)
      load()
      void refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'action failed')
    }
  }

  const owner = positions.reduce(
    (a, b) => (b.shares > (a?.shares ?? 0) ? b : a),
    null as Position | null,
  )
  const myShares = positions.find((p) => p.userId === user?.sub)?.shares ?? 0

  const makeBuyOffer = () =>
    act(async () => {
      if (!owner) throw new Error('no owner to offer to')
      await post('/api/trades', {
        toId: owner.userId,
        offer: { memes: [], coins: Number(offerCoins) || 0 },
        ask: { memes: [{ memeId: meme.id, shares: Number(offerShares) || 0 }], coins: 0 },
      })
    }, 'Buy offer sent — they’ll see it in Trades 📨')

  const makeTradeOffer = () =>
    act(async () => {
      if (!owner) throw new Error('no owner to trade with')
      if (!tradeMemeId) throw new Error('pick one of your memes to offer')
      await post('/api/trades', {
        toId: owner.userId,
        offer: { memes: [{ memeId: tradeMemeId, shares: Number(tradeGiveShares) || 0 }], coins: 0 },
        ask: { memes: [{ memeId: meme.id, shares: Number(tradeWantShares) || 0 }], coins: 0 },
      })
    }, 'Trade offer sent 🔁')

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <FoilCard tierKey={meme.tier.key}>
        <MemeMedia meme={meme} style={{ width: '100%', aspectRatio: 1 }} muted={false} />
      </FoilCard>

      <View style={{ gap: 4 }}>
        <Text style={[styles.tier, { color: meme.tier.color }]}>
          {meme.tier.name.toUpperCase()} · {meme.tier.rarity} · 👁️ {(meme.views ?? meme.reshares).toLocaleString()} views · 🔁 {(meme.reshareCount ?? 0).toLocaleString()} reshares
        </Text>
        <Pressable onPress={() => navigation.navigate('Creator', { sub: meme.creatorId })}>
          <Text style={styles.creator}>
            by <Text style={{ color: colors.accent }}>{meme.creatorName}</Text> · owned by {meme.ownerName}
          </Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <ValueChart points={history} width={width - 64} />
      </View>

      {msg && <Text style={styles.ok}>{msg}</Text>}
      {err && <Text style={styles.err}>{err}</Text>}

      {meme.listing && meme.listing.shares > 0 && meme.listing.sellerId !== user?.sub && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>
            🏷️ On sale: {meme.listing.shares} shares @ 🧠{meme.listing.pricePerShare}
          </Text>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={buyShares}
              onChangeText={setBuyShares}
            />
            <Pressable
              style={styles.btn}
              onPress={() =>
                act(
                  () => post(`/api/memes/${meme.id}/buy`, { shares: Number(buyShares) || 0 }),
                  'Shares acquired 💼',
                )
              }
            >
              <Text style={styles.btnText}>
                Buy for 🧠{Math.ceil((Number(buyShares) || 0) * meme.listing.pricePerShare)}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>💰 Make a buy offer</Text>
        <Text style={styles.dim}>Offer coins for shares — goes to the owner as a trade proposal.</Text>
        <View style={styles.row}>
          <Field label="shares" value={offerShares} onChange={setOfferShares} />
          <Field label="🧠 coins" value={offerCoins} onChange={setOfferCoins} />
          <Pressable style={styles.btn} onPress={makeBuyOffer}>
            <Text style={styles.btnText}>Send offer</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>🔁 Make a trade offer</Text>
        <Text style={styles.dim}>Swap shares of one of your memes for shares of this one.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
          {binder.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => setTradeMemeId(m.id === tradeMemeId ? '' : m.id)}
              style={[styles.binderPick, tradeMemeId === m.id && { borderColor: colors.accent }]}
            >
              <Image source={{ uri: m.imageUrl }} style={{ width: 64, height: 64, borderRadius: 8 }} />
              <Text numberOfLines={1} style={styles.binderPickText}>
                {m.title}
              </Text>
            </Pressable>
          ))}
          {binder.length === 0 && <Text style={styles.dim}>You hold no other memes to trade.</Text>}
        </ScrollView>
        <View style={styles.row}>
          <Field label="give" value={tradeGiveShares} onChange={setTradeGiveShares} />
          <Field label="want" value={tradeWantShares} onChange={setTradeWantShares} />
          <Pressable style={styles.btn} onPress={makeTradeOffer}>
            <Text style={styles.btnText}>Propose</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>📊 Positions</Text>
        {positions.map((p) => (
          <View key={p.userId} style={styles.posRow}>
            <Text style={{ color: colors.text }}>
              {p.userId === user?.sub ? 'You' : p.userId === meme.creatorId ? meme.creatorName : p.userId.slice(0, 10) + '…'}
              {p.userId === owner?.userId ? '  👑' : ''}
            </Text>
            <View style={styles.posBarWrap}>
              <View style={[styles.posBar, { width: `${p.shares}%` }]} />
            </View>
            <Text style={{ color: colors.dim }}>{p.shares}</Text>
          </View>
        ))}
        {myShares > 0 && (
          <Text style={[styles.dim, { marginTop: 6 }]}>
            Your stake: {myShares}/100 ≈ 🧠{Math.round((myShares / 100) * meme.value)}
          </Text>
        )}
      </View>
    </ScrollView>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.dim, fontSize: 11, marginBottom: 3 }}>{label}</Text>
      <TextInput style={styles.input} keyboardType="number-pad" value={value} onChangeText={onChange} />
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  cardFrame: { borderWidth: 3, borderRadius: 18, overflow: 'hidden' },
  tier: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  creator: { color: colors.dim, fontSize: 14.5 },
  panel: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  panelTitle: { color: colors.text, fontWeight: '700', fontSize: 15.5 },
  dim: { color: colors.dim, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 8, flexWrap: 'wrap' },
  input: {
    backgroundColor: colors.raised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 70,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#2c7fd8',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  ok: { color: colors.ok },
  err: { color: colors.danger },
  binderPick: {
    marginRight: 10,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 4,
    width: 76,
  },
  binderPickText: { color: colors.dim, fontSize: 10, marginTop: 2 },
  posRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  posBarWrap: {
    flex: 1,
    height: 8,
    backgroundColor: colors.raised,
    borderRadius: 4,
    overflow: 'hidden',
  },
  posBar: { height: 8, backgroundColor: colors.accent, borderRadius: 4 },
})
