export const firebaseApp = {}
export const firebaseAuth = {}
export const rtdb = {}

export async function firebaseSignIn(): Promise<void> {}
export function firebaseSignOut(): void {}
export function onFirebaseUser(callback: (user: null) => void): () => void {
  callback(null)
  return () => {}
}
