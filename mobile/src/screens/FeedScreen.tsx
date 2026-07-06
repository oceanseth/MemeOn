import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { RootStackParamList } from '../../App'
import { tierHasSheen, Sheen } from '../components/FoilCard'
import { MemeMedia } from '../components/MemeMedia'
import { useAuth } from '../context/AuthContext'
import { apiFetch, post } from '../lib/api'
import { colors } from '../lib/theme'
import type { FeedItem } from '../lib/types'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function FeedScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const [items, setItems] = useState<FeedItem[]>([])
  const [cursor, setCursor] = useState<string | null>('0')
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || cursor === null) return
    loadingRef.current = true
    setLoading(true)
    try {
      const res = await apiFetch<{ items: FeedItem[]; nextCursor: string | null }>(
        `/api/feed?cursor=${cursor}&limit=10`,
      )
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id))
        return [...prev, ...res.items.filter((i) => !seen.has(i.id))]
      })
      setCursor(res.nextCursor)
    } catch {
      /* keep whatever we have */
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [cursor])

  useEffect(() => {
    void loadMore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <FeedCard item={item} height={height} onDismiss={dismiss} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        onEndReached={loadMore}
        onEndReachedThreshold={2}
        ListEmptyComponent={
          <View style={[styles.empty, { height }]}>
            {loading ? (
              <ActivityIndicator color={colors.accent} size="large" />
            ) : (
              <Text style={styles.emptyText}>
                Feed's dry. Get friends minting memes — or hit the web app and mint your own.
              </Text>
            )}
          </View>
        }
      />
      <View style={[styles.topbar, { top: insets.top + 6 }]}>
        <Text style={styles.logo}>MemeOn</Text>
        <View style={styles.topActions}>
          <Text style={styles.coins}>🧠 {user?.coins.toLocaleString() ?? ''}</Text>
          <Pressable onPress={() => navigation.navigate('Trades')}>
            <Text style={{ fontSize: 21 }}>🔁</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Alerts')}>
            <Text style={{ fontSize: 21 }}>🔔</Text>
            {(user?.unreadAlerts ?? 0) > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{user!.unreadAlerts}</Text>
              </View>
            )}
          </Pressable>
          {user && (
            <Pressable onPress={() => navigation.navigate('Creator', { sub: user.sub })}>
              {user.picture ? (
                <Image source={{ uri: user.picture }} style={styles.miniAvatar} />
              ) : (
                <View style={[styles.miniAvatar, { backgroundColor: colors.raised }]} />
              )}
            </Pressable>
          )}
        </View>
      </View>
      <View style={[styles.hint, { bottom: insets.bottom + 10 }]}>
        <Text style={styles.hintText}>← swipe to pass · swipe to invest →</Text>
      </View>
      {user && !user.onboarding?.pack && <PackBanner />}
    </View>
  )
}

/** First-login hook: claim the free starter pack right from the feed. */
function PackBanner() {
  const { refresh } = useAuth()
  const insets = useSafeAreaInsets()
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const [summary, setSummary] = useState('')

  const claim = async () => {
    setState('busy')
    try {
      const out = await post<{ memes: { title: string }[]; reward: number }>(
        '/api/onboarding/claim-pack',
        {},
      )
      setSummary(
        out.memes.length
          ? `10 shares each: ${out.memes.map((m) => m.title).join(', ')} · +${out.reward} 🧠`
          : `+${out.reward} 🧠 braincells`,
      )
      setState('done')
      void refresh()
    } catch {
      setState('idle')
    }
  }

  return (
    <View style={[styles.packBanner, { top: insets.top + 46 }]}>
      {state === 'done' ? (
        <Text style={styles.packText}>🎁 Pack opened! {summary}</Text>
      ) : (
        <Pressable onPress={claim} disabled={state === 'busy'}>
          <Text style={styles.packText}>
            🎁{' '}
            {state === 'busy'
              ? 'Opening your starter pack…'
              : 'New here? Tap to claim your free starter pack + braincells'}
          </Text>
        </Pressable>
      )}
    </View>
  )
}

function FeedCard({
  item,
  height,
  onDismiss,
}: {
  item: FeedItem
  height: number
  onDismiss: (id: string) => void
}) {
  const navigation = useNavigation<Nav>()
  const { width } = useWindowDimensions()
  const [liked, setLiked] = useState(item.likedByMe)
  const [likeCount, setLikeCount] = useState(item.likes)
  const [burst, setBurst] = useState(false)
  const translateX = useSharedValue(0)

  const goInvest = useCallback(() => {
    navigation.navigate('Invest', { memeId: item.id })
  }, [navigation, item.id])

  const dislike = useCallback(() => {
    onDismiss(item.id)
    void post(`/api/memes/${item.id}/dislike`).catch(() => {})
  }, [item.id, onDismiss])

  const toggleLike = useCallback(() => {
    setLiked((prev) => {
      const next = !prev
      setLikeCount((c) => c + (next ? 1 : -1))
      void post(`/api/memes/${item.id}/${next ? 'like' : 'unlike'}`).catch(() => {})
      return next
    })
  }, [item.id])

  const likeOnly = useCallback(() => {
    if (!liked) toggleLike()
    setBurst(true)
    setTimeout(() => setBurst(false), 700)
  }, [liked, toggleLike])

  const pan = Gesture.Pan()
    .activeOffsetX([-18, 18])
    .failOffsetY([-14, 14])
    .onUpdate((e) => {
      translateX.value = e.translationX
    })
    .onEnd((e) => {
      if (e.translationX < -90) {
        translateX.value = withTiming(-width * 1.2, { duration: 220 }, () => {
          runOnJS(dislike)()
        })
      } else {
        if (e.translationX > 90) runOnJS(goInvest)()
        translateX.value = withSpring(0)
      }
    })

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => runOnJS(likeOnly)())

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${translateX.value / 30}deg` },
    ],
  }))

  const friendLine =
    item.friendOwners.length > 0
      ? `💼 ${item.friendOwners.slice(0, 2).join(', ')} own${item.friendOwners.length === 1 ? 's' : ''} this`
      : item.friendLikers.length > 0
        ? `❤️ liked by ${item.friendLikers.slice(0, 2).join(', ')}`
        : null

  return (
    <GestureDetector gesture={Gesture.Exclusive(doubleTap, pan)}>
      <Animated.View style={[{ height }, styles.card, cardStyle]}>
        <MemeMedia meme={item} style={StyleSheet.absoluteFill} />
        {tierHasSheen(item.tier.key) && <Sheen width={width} />}
        <View style={styles.shade} />
        {burst && (
          <View style={styles.burst} pointerEvents="none">
            <Text style={{ fontSize: 110 }}>❤️</Text>
          </View>
        )}

        {friendLine && (
          <View style={styles.friendChip}>
            <Text style={styles.friendChipText}>{friendLine}</Text>
          </View>
        )}

        <View style={styles.info}>
          <View style={[styles.tierChip, { borderColor: item.tier.color }]}>
            <Text style={[styles.tierChipText, { color: item.tier.color }]}>
              {item.tier.name.toUpperCase()} · {item.tier.rarity}
            </Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Pressable onPress={() => navigation.navigate('Creator', { sub: item.creatorId })}>
            <Text style={styles.creator}>by {item.creatorName} →</Text>
          </Pressable>
          <Text style={styles.stats}>
            🔁 {item.reshares.toLocaleString()}   🧠 {item.value.toLocaleString()}
            {item.mediaType === 'video' ? '   🎬 video' : ''}
          </Text>
        </View>

        <View style={styles.rail}>
          <Pressable style={styles.railBtn} onPress={toggleLike}>
            <Text style={{ fontSize: 34 }}>{liked ? '❤️' : '🤍'}</Text>
            <Text style={styles.railCount}>{likeCount}</Text>
          </Pressable>
          <Pressable style={styles.railBtn} onPress={goInvest}>
            <Text style={{ fontSize: 30 }}>📈</Text>
            <Text style={styles.railCount}>invest</Text>
          </Pressable>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.bg, overflow: 'hidden', justifyContent: 'flex-end' },
  shade: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: 'transparent',
    borderBottomWidth: 260,
    borderBottomColor: 'rgba(6,8,14,0.72)',
  },
  burst: {
    ...(StyleSheet.absoluteFill as object),
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { color: colors.accent, fontWeight: '800', fontSize: 20 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  coins: { color: colors.gold, fontWeight: '700', fontSize: 15 },
  miniAvatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.danger,
    borderRadius: 999,
    paddingHorizontal: 4,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  packBanner: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: 'rgba(44, 127, 216, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  packText: { color: '#fff', fontWeight: '700', fontSize: 13.5, textAlign: 'center' },
  hint: { position: 'absolute', alignSelf: 'center' },
  hintText: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  friendChip: {
    position: 'absolute',
    top: 110,
    left: 16,
    backgroundColor: 'rgba(10,13,22,0.75)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  friendChipText: { color: colors.text, fontSize: 12.5, fontWeight: '600' },
  info: { padding: 18, paddingBottom: 64, gap: 6, paddingRight: 86 },
  tierChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  tierChipText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  creator: { color: colors.accent, fontSize: 14.5, fontWeight: '600' },
  stats: { color: colors.dim, fontSize: 14 },
  rail: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center',
    gap: 22,
  },
  railBtn: { alignItems: 'center' },
  railCount: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 2 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: colors.dim, textAlign: 'center', fontSize: 16, lineHeight: 24 },
})
