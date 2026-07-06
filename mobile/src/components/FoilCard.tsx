// Tier foil treatment for mobile — brand parity with the web's CSS foil frames.
// Gradient border per tier; holo+ tiers get an animated sheen sweep.
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import type { ReactNode } from 'react'

export const TIER_GRADIENTS: Record<string, [string, string, ...string[]]> = {
  paper: ['#3a4152', '#262c3a'],
  silver: ['#9aa7b8', '#5c6778', '#aeb9c9'],
  holo: ['#46d3ff', '#7a5cff', '#ff5ce1'],
  chrome: ['#cfd8ff', '#6f7ba8', '#f4f7ff', '#8a96c8'],
  gold: ['#b8860b', '#ffd76a', '#fff3c4', '#8f6508'],
  prismatic: ['#ff5c5c', '#ffb85c', '#f7ff5c', '#6bff8a', '#5cd4ff', '#8a6bff'],
  shiny: ['#0ff0c3', '#9fffe0', '#5cd4ff', '#f0c3ff', '#ffd76a'],
}

const SHEEN_TIERS = new Set(['holo', 'chrome', 'gold', 'prismatic', 'shiny'])

export const tierHasSheen = (tierKey: string): boolean => SHEEN_TIERS.has(tierKey)

export function FoilCard({
  tierKey,
  radius = 18,
  style,
  children,
}: {
  tierKey: string
  radius?: number
  style?: ViewStyle
  children: ReactNode
}) {
  const gradient = TIER_GRADIENTS[tierKey] ?? TIER_GRADIENTS.paper
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: radius, padding: 3 }, style]}
    >
      <View style={{ borderRadius: radius - 3, overflow: 'hidden' }}>
        {children}
        {SHEEN_TIERS.has(tierKey) && <Sheen />}
      </View>
    </LinearGradient>
  )
}

/** Diagonal highlight strip sweeping across the card, foil-style. */
export function Sheen({ width = 600 }: { width?: number }) {
  const x = useSharedValue(-width)
  useEffect(() => {
    x.value = -width
    x.value = withRepeat(
      withTiming(width, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
      -1,
    )
  }, [width, x])
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { rotate: '18deg' }] }))
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill as object, style]}>
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.34)', 'rgba(255,255,255,0.16)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: 130, height: '160%', marginTop: '-20%' }}
      />
    </Animated.View>
  )
}
