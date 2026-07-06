import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import type { RootStackParamList } from '../../App'
import { FoilCard } from '../components/FoilCard'
import { apiFetch, post } from '../lib/api'
import { colors } from '../lib/theme'
import type { CreatorProfile, Meme } from '../lib/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Creator'>

export default function CreatorScreen({ route, navigation }: Props) {
  const { sub } = route.params
  const [data, setData] = useState<CreatorProfile | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [tab, setTab] = useState<'created' | 'binder'>('created')

  const load = useCallback(() => {
    apiFetch<CreatorProfile>(`/api/users/${encodeURIComponent(sub)}/profile`)
      .then((d) => {
        setData(d)
        navigation.setOptions({ title: d.profile.name })
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'failed to load'))
  }, [sub, navigation])

  useEffect(load, [load])

  if (!data) {
    return (
      <View style={styles.center}>
        {err ? <Text style={{ color: colors.danger }}>{err}</Text> : <ActivityIndicator color={colors.accent} />}
      </View>
    )
  }

  const { profile, followingByMe, friendStatus } = data
  const memes: (Meme & { shares?: number })[] = tab === 'created' ? data.created : data.binder

  const toggleFollow = async () => {
    await post(`/api/users/${encodeURIComponent(sub)}/${followingByMe ? 'unfollow' : 'follow'}`).catch(() => {})
    load()
  }

  const friendAction = async () => {
    if (friendStatus === null) {
      await post('/api/friends/request', { userId: sub }).catch(() => {})
    } else if (friendStatus === 'incoming') {
      await post('/api/friends/respond', { userId: sub, accept: true }).catch(() => {})
    }
    load()
  }

  const friendLabel =
    friendStatus === 'accepted'
      ? '🤝 Friends'
      : friendStatus === 'outgoing'
        ? '⏳ Requested'
        : friendStatus === 'incoming'
          ? '✅ Accept request'
          : '👋 Add friend'

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      data={memes}
      keyExtractor={(m) => `${tab}-${m.id}`}
      numColumns={2}
      columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
      contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
      ListHeaderComponent={
        <View style={styles.head}>
          {profile.picture ? (
            <Image source={{ uri: profile.picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.raised }]} />
          )}
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.stats}>
            ⭐ {profile.followers} followers · 📚 {profile.collectionSize} memes · 🧠{' '}
            {profile.portfolioValue.toLocaleString()}
          </Text>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, followingByMe && styles.btnGhost]} onPress={toggleFollow}>
              <Text style={styles.btnText}>{followingByMe ? '★ Following' : '☆ Follow'}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, friendStatus === 'accepted' && styles.btnGhost]}
              onPress={friendAction}
              disabled={friendStatus === 'accepted' || friendStatus === 'outgoing'}
            >
              <Text style={styles.btnText}>{friendLabel}</Text>
            </Pressable>
          </View>
          <View style={styles.tabs}>
            <Pressable onPress={() => setTab('created')}>
              <Text style={[styles.tab, tab === 'created' && styles.tabActive]}>
                Created ({data.created.length})
              </Text>
            </Pressable>
            <Pressable onPress={() => setTab('binder')}>
              <Text style={[styles.tab, tab === 'binder' && styles.tabActive]}>
                Binder ({data.binder.length})
              </Text>
            </Pressable>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <FoilCard tierKey={item.tier.key} radius={12} style={{ flex: 1 }}>
          <Pressable
            style={styles.gridCard}
            onPress={() => navigation.push('Invest', { memeId: item.id })}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.gridImg} />
            <Text numberOfLines={1} style={styles.gridTitle}>
              {item.title}
            </Text>
            <Text style={[styles.gridTier, { color: item.tier.color }]}>
              {item.tier.name}
              {item.shares !== undefined ? ` · ${item.shares}/100` : ''} · 🧠{item.value}
            </Text>
          </Pressable>
        </FoilCard>
      )}
      ListEmptyComponent={
        <Text style={{ color: colors.dim, textAlign: 'center', padding: 30 }}>Nothing here yet.</Text>
      }
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  head: { alignItems: 'center', padding: 20, gap: 6 },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: colors.border },
  name: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 6 },
  stats: { color: colors.dim, fontSize: 13.5 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: {
    backgroundColor: '#2c7fd8',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  btnGhost: { backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.border },
  btnText: { color: '#fff', fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 22, marginTop: 16 },
  tab: { color: colors.dim, fontWeight: '700', fontSize: 15 },
  tabActive: { color: colors.accent },
  gridCard: {
    backgroundColor: colors.card,
    paddingBottom: 8,
  },
  gridImg: { width: '100%', aspectRatio: 1 },
  gridTitle: { color: colors.text, fontWeight: '700', paddingHorizontal: 8, paddingTop: 6 },
  gridTier: { fontSize: 11.5, fontWeight: '700', paddingHorizontal: 8, paddingTop: 2 },
})
