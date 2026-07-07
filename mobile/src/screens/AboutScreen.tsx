import { useEffect, useState } from 'react'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { TIER_GRADIENTS } from '../components/FoilCard'
import { apiFetch } from '../lib/api'
import { colors } from '../lib/theme'
import { TIERS } from '../../../shared/tiers'

interface FrameInfo {
  key: string
  url: string
}

/** The landing-page story, in-app: what MemeOn is, the tiers, the FAQ. */
export default function AboutScreen() {
  const [frames, setFrames] = useState<Record<string, string>>({})

  useEffect(() => {
    apiFetch<{ frames: FrameInfo[] }>('/api/frames')
      .then((r) => setFrames(Object.fromEntries(r.frames.map((f) => [f.key, f.url]))))
      .catch(() => {})
  }, [])

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 48 }}>
      <View style={{ alignItems: 'center', paddingVertical: 18 }}>
        <Image source={require('../../assets/brand-logo.png')} style={{ width: 110, height: 110 }} />
        <Text style={styles.h1}>
          Memes are the new <Text style={{ color: colors.accent }}>trading cards</Text>
        </Text>
        <Text style={styles.lead}>
          Mint your memes, watch them climb the virality tiers as they get reshared, and trade
          positions with friends. Every meme gets a share link whose card frame levels up as it
          spreads.
        </Text>
      </View>

      <Text style={styles.h2}>The Virality Tiers</Text>
      <Text style={styles.sub}>
        Reshares power everything. Share a meme's link anywhere — every unfurl and click counts —
        and its card physically transforms as it ascends.
      </Text>
      {TIERS.map((t) => (
        <LinearGradient
          key={t.key}
          colors={TIER_GRADIENTS[t.key] ?? TIER_GRADIENTS.paper}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tierWrap}
        >
          <View style={styles.tierInner}>
            {frames[t.key] ? (
              <Image source={{ uri: frames[t.key] }} style={styles.tierImg} />
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={[styles.tierName, { color: t.color }]}>
                {t.name} · {t.rarity}
              </Text>
              <Text style={styles.tierReq}>{t.minReshares.toLocaleString()}+ views</Text>
              <Text style={styles.tierHype}>{t.hype}</Text>
            </View>
          </View>
        </LinearGradient>
      ))}

      <Text style={styles.h2}>FAQ</Text>
      <Faq q="WTF is MemeOn?">
        A meme trading card market. You mint memes (upload or generate them with your Masky
        credits), each one becomes a 100-share collectible card, and its rarity tier is driven by
        real reshares of its unique link.
      </Faq>
      <Faq q="What are braincells? 🧠">
        MemeOn's currency — buy shares, fund trades, climb the 🏆 Top Brains leaderboard. Everyone
        starts at zero and earns their first braincells through onboarding quests: claim your free
        starter pack, mint, get reshared, make a friend, close a trade.
      </Faq>
      <Faq q="How do I invest in a meme?">
        Memes are split into 100 shares. Holders list shares for braincells; buy from the
        marketplace or swipe right in the feed to make offers. When your meme sells or tiers up,
        you get an alert.
      </Faq>
      <Faq q="What's Masky got to do with it?">
        Login is "Sign in with Masky" — your avatar is your identity, generation runs on your own
        Masky credits, and your real identity stays protected. Configure an agentic harness on
        Masky and your avatar can trade, mint, and hunt reshares for you.
      </Faq>
    </ScrollView>
  )
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <View style={styles.faq}>
      <Text style={styles.faqQ}>{q}</Text>
      <Text style={styles.faqA}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  h1: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },
  lead: { color: colors.dim, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10 },
  h2: { color: colors.text, fontSize: 21, fontWeight: '800', marginTop: 26, marginBottom: 6 },
  sub: { color: colors.dim, fontSize: 13.5, lineHeight: 20, marginBottom: 12 },
  tierWrap: { borderRadius: 14, padding: 2.5, marginBottom: 10 },
  tierInner: {
    backgroundColor: colors.card,
    borderRadius: 11.5,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  tierImg: { width: 62, height: 82, borderRadius: 6, backgroundColor: '#0a0c12' },
  tierName: { fontWeight: '800', fontSize: 15.5 },
  tierReq: { color: colors.dim, fontSize: 12, fontWeight: '700', marginTop: 1 },
  tierHype: { color: colors.dim, fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  faq: {
    backgroundColor: colors.raised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  faqQ: { color: colors.text, fontWeight: '700', fontSize: 15 },
  faqA: { color: colors.dim, fontSize: 13.5, lineHeight: 20, marginTop: 6 },
})
