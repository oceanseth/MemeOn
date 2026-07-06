import { initializeApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
  type User,
} from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyDCEz92k0g4qD7LID2vPfQQTnSiLluixzo',
  authDomain: 'memeon-8ab5f.firebaseapp.com',
  databaseURL: 'https://memeon-8ab5f-default-rtdb.firebaseio.com',
  projectId: 'memeon-8ab5f',
  storageBucket: 'memeon-8ab5f.firebasestorage.app',
  messagingSenderId: '196340103120',
  appId: '1:196340103120:web:0b3cd4c2150415b669ebd5',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const firebaseAuth = getAuth(firebaseApp)
export const rtdb = getDatabase(firebaseApp)

/** Sign into our Firebase project with the custom token minted by the API at Masky login. */
export async function firebaseSignIn(customToken: string): Promise<void> {
  await signInWithCustomToken(firebaseAuth, customToken)
}

export function firebaseSignOut(): void {
  void signOut(firebaseAuth).catch(() => {})
}

export function onFirebaseUser(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth, cb)
}
