import { View, Text } from 'react-native'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import { colors } from '../lib/theme'
import type { HistoryPoint } from '../lib/types'

/** Stock-style value-over-time area chart (pure svg, no chart lib). */
export function ValueChart({
  points,
  width,
  height = 160,
  color = colors.accent,
}: {
  points: HistoryPoint[]
  width: number
  height?: number
  color?: string
}) {
  if (points.length === 0) return null
  const pts = points.length === 1 ? [points[0], points[0]] : points
  const values = pts.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 8
  const w = width - pad * 2
  const h = height - pad * 2

  const xy = pts.map((p, i) => [
    pad + (i / (pts.length - 1)) * w,
    pad + h - ((p.value - min) / span) * h,
  ])
  const line = xy.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${(pad + w).toFixed(1)},${(pad + h).toFixed(1)} L${pad},${(pad + h).toFixed(1)} Z`

  const first = pts[0].value
  const last = pts[pts.length - 1].value
  const delta = last - first
  const deltaPct = first > 0 ? ((delta / first) * 100).toFixed(1) : '0.0'

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>🧠 {last.toLocaleString()}</Text>
        <Text style={{ color: delta >= 0 ? colors.ok : colors.danger, fontWeight: '700' }}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toLocaleString()} ({deltaPct}%)
        </Text>
      </View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.35} />
            <Stop offset="1" stopColor={color} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#fill)" />
        <Path d={line} stroke={color} strokeWidth={2.5} fill="none" />
      </Svg>
    </View>
  )
}
