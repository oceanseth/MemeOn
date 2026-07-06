import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import type { RootStackParamList } from '../../App'
import { useAuth } from '../context/AuthContext'
import { apiFetch, post } from '../lib/api'
import { colors } from '../lib/theme'
import type { Alert } from '../lib/types'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function AlertsScreen() {
  const navigation = useNavigation<Nav>()
  const { refresh } = useAuth()
  const [alerts, setAlerts] = useState<Alert[] | null>(null)

  useEffect(() => {
    apiFetch<{ alerts: Alert[] }>('/api/alerts')
      .then(async (r) => {
        setAlerts(r.alerts)
        const unread = r.alerts.filter((a) => !a.read).map((a) => a.id)
        if (unread.length) {
          await post('/api/alerts/read', { ids: unread }).catch(() => {})
          void refresh()
        }
      })
      .catch(() => setAlerts([]))
  }, [refresh])

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 14, gap: 8 }}
      data={alerts ?? []}
      keyExtractor={(a) => a.id}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.row, !item.read && styles.unread]}
          onPress={() => item.memeId && navigation.navigate('Invest', { memeId: item.memeId })}
        >
          <Text style={styles.msg}>{item.message}</Text>
          <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
        </Pressable>
      )}
      ListEmptyComponent={
        alerts === null ? null : (
          <Text style={styles.empty}>No alerts yet — go make noise. 📣</Text>
        )
      }
    />
  )
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    gap: 4,
  },
  unread: { borderColor: colors.accent, backgroundColor: '#16233a' },
  msg: { color: colors.text, fontSize: 14.5, lineHeight: 20 },
  time: { color: colors.dim, fontSize: 11.5 },
  empty: { color: colors.dim, textAlign: 'center', padding: 40, fontSize: 15 },
})
