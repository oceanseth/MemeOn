import { NavigationContainer, DarkTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { colors } from './src/lib/theme'
import LoginScreen from './src/screens/LoginScreen'
import FeedScreen from './src/screens/FeedScreen'
import InvestScreen from './src/screens/InvestScreen'
import CreatorScreen from './src/screens/CreatorScreen'
import AlertsScreen from './src/screens/AlertsScreen'
import TradesScreen from './src/screens/TradesScreen'
import AboutScreen from './src/screens/AboutScreen'

export type RootStackParamList = {
  Feed: undefined
  Invest: { memeId: string }
  Creator: { sub: string }
  Alerts: undefined
  Trades: undefined
  About: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.raised,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
}

function Root() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }
  if (!user) return <LoginScreen />
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Feed" component={FeedScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Invest" component={InvestScreen} options={{ title: 'Invest' }} />
        <Stack.Screen name="Creator" component={CreatorScreen} options={{ title: 'Creator' }} />
        <Stack.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Alerts' }} />
        <Stack.Screen name="Trades" component={TradesScreen} options={{ title: 'Trades' }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ title: 'MemeOn' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Root />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
