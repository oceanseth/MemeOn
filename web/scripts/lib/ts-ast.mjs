import ts from 'typescript'

export const scriptKindFor = (file) => {
  if (file.endsWith('.jsx')) return ts.ScriptKind.JSX
  if (file.endsWith('.tsx')) return ts.ScriptKind.TSX
  return ts.ScriptKind.TS
}

export const staticModuleSpecifier = (node) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  return undefined
}
