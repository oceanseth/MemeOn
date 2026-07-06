import Constants from 'expo-constants'

/** API origin. Defaults to the dev site; override via app.json extra.apiBase. */
export const API_BASE: string =
  (Constants.expoConfig?.extra?.apiBase as string | undefined) ?? 'https://dev.memeon.ai'
