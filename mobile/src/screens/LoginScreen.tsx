import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { loginWithMasky } from '../lib/auth'
import { colors } from '../lib/theme'

export default function LoginScreen() {
  const { refresh } = useAuth()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const login = async () => {
    setBusy(true)
    setErr(null)
    try {
      await loginWithMasky()
      await refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.logo}>MemeOn</Text>
      <Text style={styles.tag}>
        Memes are the new trading cards.{'\n'}Scroll. Like. Invest.
      </Text>
      <Pressable style={styles.btn} onPress={login} disabled={busy}>
        <Text style={styles.btnText}>{busy ? 'Opening Masky…' : '🎭  Log in with Masky'}</Text>
      </Pressable>
      {err && <Text style={styles.err}>{err}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 18,
  },
  logo: { fontSize: 44, fontWeight: '800', color: colors.accent },
  tag: { color: colors.dim, fontSize: 16, textAlign: 'center', lineHeight: 24 },
  btn: {
    backgroundColor: '#2c7fd8',
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  err: { color: colors.danger, textAlign: 'center' },
})
