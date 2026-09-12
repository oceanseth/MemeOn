/** The letter a pictureless avatar shows: first grapheme, uppercased, `?` when the name is blank. */
export function avatarInitial(name: string): string {
  return ([...name.trim()][0] ?? '?').toLocaleUpperCase()
}
