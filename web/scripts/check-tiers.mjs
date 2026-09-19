#!/usr/bin/env node
/**
 * Structural check for a molecularized React `src/`.
 *
 *   node scripts/check-tiers.mjs [srcDir]
 *
 * Fails (exit 1) on:
 *   - a value import or re-export from a higher tier, or hooks/ or stores/, below views/
 *   - a screens/ file that value-imports or re-exports another screens/ module
 *   - a value import from copy/ in any tier (strings reach components through the model)
 *   - a value import in copy/ that leaves copy/, other than lib/plural and lib/braincells
 *     (copy is plain data; the two formatting helpers are the one allowance)
 *   - a React state hook in a component or helper below views/
 *   - React context (createContext / useContext) below views/, except inside atoms/, where a
 *     compound atom (toggle group, tabs) hands its variant to its parts through a context
 *   - a state-library import below views/
 *   - a component in a tier folder without a sibling story
 *   - a .tsx or .jsx component outside a tier folder, except the listed
 *     source-relative integration files below
 *
 * Type-only imports are ignored: they are erased and carry no behavior.
 * TypeScript's parser handles comments, aliases, generics, re-exports, and
 * side-effect imports without guessing from source text.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { basename, dirname, join, relative, resolve, sep } from "node:path"
import ts from "typescript"

const TIERS = ["atoms", "molecules", "organisms", "screens", "views"]
const ENGINES = ["hooks", "stores"]
// User-facing strings. Read by hooks/, lib/ builders, stories and tests; never by a tier.
const COPY = "copy"
// The formatting primitives copy/ may call, so a noun stays beside its sentence
// (`${plural(n, 'card')} shown`). Pure functions with no React and no strings of their own.
const COPY_HELPERS = new Set(["lib/plural", "lib/braincells"])
const ALLOWED = {
  atoms: ["atoms"],
  molecules: ["atoms", "molecules"],
  organisms: ["atoms", "molecules", "organisms"],
  // Screens are route surfaces: they compose lower tiers, never another screens/ module.
  screens: ["atoms", "molecules", "organisms"],
  views: [...TIERS, ...ENGINES],
}
// useRef, useId, useCallback, useMemo, useImperativeHandle, and forwardRef are omitted on
// purpose: a molecule may hold useRef as an imperative handle to a primitive it composes.
// The omit is not an excuse for useState (or any name in this set).
const STATE_HOOKS = new Set(["useState", "useReducer", "useEffect", "useLayoutEffect", "useContext", "useSyncExternalStore"])
// The context API is component-local wiring, not state: a shadcn-style compound atom creates a
// context for its variant and its parts read it. Allowed in atoms/ only; everywhere else below
// views/ it is reported like a state hook.
const CONTEXT_API = new Set(["createContext", "useContext"])
const CHECKED = new Set([...STATE_HOOKS, ...CONTEXT_API])
const isAllowedInTier = (tier, name) => tier === "atoms" && CONTEXT_API.has(name)
const hookProblem = (name) => (CONTEXT_API.has(name) ? "React context below views/ (only an atom may create or read a variant context)" : "React state hook below views/ (lift it into hooks/ and pass a prop)")
// `@/x/…` is `src/x/…` (tsconfig `paths`, vite `resolve.alias`); a tier import spelled through the
// alias lands in the folder the relative form would.
const ALIAS = "@/"
const STATE_LIBS = /^(mobx|mobx-react(-lite)?|zustand|jotai|valtio|recoil|redux|@reduxjs\/toolkit|react-redux|@tanstack\/react-query|swr|@xstate\/react|xstate)(\/|$)/

// These are integration points, not tier components. Keep this list exact so a
// new .tsx file beside one of them still has to join a tier.
const EXCEPTIONS = new Map([
  ["main.tsx", "application bootstrap"],
  ["stores/StoresContext.tsx", "root store provider"],
])

const args = process.argv.slice(2)
const positional = args.filter((arg) => !arg.startsWith("--"))
const src = resolve(positional[0] ?? "src")
const webRoot = resolve(import.meta.dirname, "..")

if (!existsSync(src)) {
  console.error(`check-tiers: ${src} does not exist`)
  process.exit(2)
}

const toSourcePath = (file) => relative(src, file).split(sep).join("/")
const isStoryFile = (name) => /\.stories\.(tsx|jsx)$/.test(name)
const isTestFile = (name) => /\.(test|spec)\.(ts|tsx|jsx)$/.test(name)
const isComponentFile = (name) => /\.(tsx|jsx)$/.test(name) && !isStoryFile(name) && !isTestFile(name)
const isTierSourceFile = (name) => /\.(ts|tsx|jsx)$/.test(name) && !isStoryFile(name) && !isTestFile(name)

/** The absolute file an alias or relative specifier names, before extension probing; undefined for a package. */
const specifierTarget = (fromFile, spec) => {
  if (spec.startsWith(ALIAS)) return resolve(src, spec.slice(ALIAS.length))
  if (spec.startsWith(".")) return resolve(dirname(fromFile), spec)
  return undefined
}

/** Which top-level folder under src a resolved import lands in, if any. */
const folderOf = (fromFile, spec) => {
  const target = specifierTarget(fromFile, spec)
  if (!target) return undefined
  const sourceRelative = relative(src, target)
  if (sourceRelative.startsWith("..")) return undefined
  const [first] = sourceRelative.split(sep)
  return first && first.includes(".") ? undefined : first
}

const scriptKindFor = (file) => {
  if (file.endsWith(".jsx")) return ts.ScriptKind.JSX
  if (file.endsWith(".tsx")) return ts.ScriptKind.TSX
  return ts.ScriptKind.TS
}

const staticModuleSpecifier = (node) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  return undefined
}

const relativeModuleFile = (fromFile, spec) => {
  const base = specifierTarget(fromFile, spec)
  if (!base) return undefined
  const candidates = [base, ...[".ts", ".tsx", ".js", ".jsx"].map((extension) => `${base}${extension}`), ...["index.ts", "index.tsx", "index.js", "index.jsx"].map((index) => join(base, index))]
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile())
}

const reactHookExportCache = new Map()
const isReactHookExport = (file, spec, exportedName, visited = new Set()) => {
  const moduleFile = relativeModuleFile(file, spec)
  if (!moduleFile) return false
  const cacheKey = `${moduleFile}:${exportedName}`
  if (reactHookExportCache.has(cacheKey)) return reactHookExportCache.get(cacheKey)
  if (visited.has(cacheKey)) return false
  visited.add(cacheKey)
  const sourceFile = ts.createSourceFile(moduleFile, readFileSync(moduleFile, "utf8"), ts.ScriptTarget.Latest, true, scriptKindFor(moduleFile))
  const matches = sourceFile.statements.some((statement) => {
    if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier || isTypeOnlyExport(statement)) return false
    const target = staticModuleSpecifier(statement.moduleSpecifier)
    if (!target) return false
    if (target === "react" && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      return statement.exportClause.elements.some((element) => (element.name.text === exportedName) && CHECKED.has(element.propertyName?.text ?? element.name.text))
    }
    if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      return statement.exportClause.elements.some((element) => element.name.text === exportedName && isReactHookExport(moduleFile, target, element.propertyName?.text ?? element.name.text, visited))
    }
    return isReactHookExport(moduleFile, target, exportedName, visited)
  })
  reactHookExportCache.set(cacheKey, matches)
  return matches
}

const isTypeOnlyImport = (clause) => {
  if (!clause || clause.isTypeOnly) return Boolean(clause?.isTypeOnly)
  if (clause.name || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) return false
  return clause.namedBindings.elements.length > 0 && clause.namedBindings.elements.every((specifier) => specifier.isTypeOnly)
}

const isTypeOnlyExport = (statement) => {
  if (statement.isTypeOnly) return true
  if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) return false
  return statement.exportClause.elements.length > 0 && statement.exportClause.elements.every((specifier) => specifier.isTypeOnly)
}

const walk = (dir) => readdirSync(dir).flatMap((entry) => {
  const file = join(dir, entry)
  return statSync(file).isDirectory() ? walk(file) : [file]
})

const problems = []
const report = (file, message) => problems.push(`${toSourcePath(file)}: ${message}`)
let components = 0
let stories = 0
const tierSources = []

const reportModule = (file, tier, spec) => {
  if (tier !== "views" && STATE_LIBS.test(spec)) {
    report(file, `imports state library "${spec}" below views/`)
    return
  }
  const folder = folderOf(file, spec)
  if (folder === COPY) {
    report(file, `${tier} imports from copy/ ("${spec}"): strings reach components through the model`)
    return
  }
  if (folder !== undefined && (TIERS.includes(folder) || ENGINES.includes(folder)) && !ALLOWED[tier].includes(folder)) {
    // Co-located assets (`./LandingScreen.css`) live in the tier folder but are not a screens/ module.
    const moduleFile = relativeModuleFile(file, spec)
    if (moduleFile && !isTierSourceFile(basename(moduleFile))) return
    report(file, `${tier} imports from ${folder}/ ("${spec}")`)
  }
}

/** copy/ modules may import other copy/ modules, the listed formatting helpers, and types; nothing else. */
const inspectCopySource = (file) => {
  const sourceFile = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, scriptKindFor(file))
  const check = (spec) => {
    if (folderOf(file, spec) === COPY) return
    const resolved = specifierTarget(file, spec)
    const target = resolved ? relative(src, resolved).split(sep).join("/").replace(/\.(ts|js)$/, "") : spec
    if (COPY_HELPERS.has(target)) return
    report(file, `copy/ imports "${spec}": copy is plain data and imports only copy/ (plus ${[...COPY_HELPERS].join(", ")})`)
  }
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && !isTypeOnlyImport(statement.importClause)) {
      const spec = staticModuleSpecifier(statement.moduleSpecifier)
      if (spec) check(spec)
    } else if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && !isTypeOnlyExport(statement)) {
      const spec = staticModuleSpecifier(statement.moduleSpecifier)
      if (spec) check(spec)
    }
  }
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const spec = staticModuleSpecifier(node.arguments[0])
      if (spec) check(spec)
    }
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(sourceFile, visit)
}

const reactDeclaration = (declaration) => /node_modules[\\/](@types[\\/]react|react)[\\/]/.test(declaration.getSourceFile().fileName)

const resolvedSymbol = (checker, node) => {
  let symbol = checker.getSymbolAtLocation(node)
  if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
  return symbol
}

const isReactHookSymbol = (symbol) => symbol && CHECKED.has(symbol.getName()) && symbol.declarations?.some(reactDeclaration)

const isReactNamespaceSymbol = (symbol) => symbol?.declarations?.some((declaration) => {
  let current = declaration
  while (current && !ts.isImportDeclaration(current)) current = current.parent
  return current && ts.isStringLiteral(current.moduleSpecifier) && current.moduleSpecifier.text === "react"
})

const unwrapExpression = (expression) => {
  let unwrapped = expression
  while (ts.isParenthesizedExpression(unwrapped)) unwrapped = unwrapped.expression
  return unwrapped
}

/** The React name a `const { useState: s } = React` binding destructures, when it is one this script checks. */
const reactDestructuredHookName = (checker, symbol) => {
  for (const declaration of symbol?.declarations ?? []) {
    if (!ts.isBindingElement(declaration) || !ts.isObjectBindingPattern(declaration.parent)) continue
    const variable = declaration.parent.parent
    if (!ts.isVariableDeclaration(variable) || !variable.initializer) continue
    const propertyName = declaration.propertyName?.getText() ?? declaration.name.getText()
    if (!CHECKED.has(propertyName)) continue
    if (ts.isIdentifier(variable.initializer) && isReactNamespaceSymbol(checker.getSymbolAtLocation(variable.initializer))) return propertyName
  }
  return undefined
}

/** The React hook or context call `call` resolves to, by symbol, or undefined. */
const reactHookCallName = (checker, call) => {
  const callee = unwrapExpression(call.expression)
  const symbol = ts.isPropertyAccessExpression(callee)
    ? resolvedSymbol(checker, callee.name)
    : resolvedSymbol(checker, callee)
  if (isReactHookSymbol(symbol)) return symbol.getName()
  return ts.isIdentifier(callee) ? reactDestructuredHookName(checker, symbol) : undefined
}

const bindingPatternContains = (name, target) => {
  if (ts.isIdentifier(name)) return name.text === target
  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) return name.elements.some((element) => ts.isBindingElement(element) && bindingPatternContains(element.name, target))
  return false
}

const statementDeclares = (statement, name) => {
  if (ts.isVariableStatement(statement)) return statement.declarationList.declarations.some((declaration) => bindingPatternContains(declaration.name, name))
  if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)) && statement.name) return statement.name.text === name
  return false
}

const isShadowed = (node, name) => {
  for (let current = node.parent; current && !ts.isSourceFile(current); current = current.parent) {
    if (ts.isFunctionLike(current) && current.parameters.some((parameter) => bindingPatternContains(parameter.name, name))) return true
    if (ts.isBlock(current) && current.statements.some((statement) => statementDeclares(statement, name))) return true
    if (ts.isCatchClause(current) && current.variableDeclaration && bindingPatternContains(current.variableDeclaration.name, name)) return true
    if (ts.isForStatement(current) && ts.isVariableDeclarationList(current.initializer) && current.initializer.declarations.some((declaration) => bindingPatternContains(declaration.name, name))) return true
  }
  return false
}

const inspectTierSource = (file, tier, checker, program) => {
  const sourceFile = program.getSourceFile(file)
  if (!sourceFile) return
  const stateHookImports = new Map()
  const reactNamespaceImports = new Set()

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const spec = ts.isStringLiteral(statement.moduleSpecifier) ? statement.moduleSpecifier.text : undefined
      if (!spec || isTypeOnlyImport(statement.importClause)) continue
      reportModule(file, tier, spec)
      if (statement.importClause) {
        if (spec === "react" && statement.importClause.name) reactNamespaceImports.add(statement.importClause.name.text)
        const bindings = statement.importClause.namedBindings
        if (spec === "react" && bindings && ts.isNamespaceImport(bindings)) reactNamespaceImports.add(bindings.name.text)
        if (bindings && ts.isNamedImports(bindings)) {
          for (const binding of bindings.elements) {
            if (binding.isTypeOnly) continue
            const importedName = binding.propertyName?.text ?? binding.name.text
            if (CHECKED.has(importedName) && (spec === "react" || isReactHookExport(file, spec, importedName))) stateHookImports.set(binding.name.text, importedName)
            if (spec === "react" && importedName === "default") reactNamespaceImports.add(binding.name.text)
          }
        }
      }
      continue
    }

    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && !isTypeOnlyExport(statement)) {
      if (ts.isStringLiteral(statement.moduleSpecifier)) reportModule(file, tier, statement.moduleSpecifier.text)
    }
  }

  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const spec = staticModuleSpecifier(node.arguments[0])
        if (spec) reportModule(file, tier, spec)
      }

      if (tier !== "views") {
        const callee = unwrapExpression(node.expression)
        const direct = ts.isIdentifier(callee) && stateHookImports.has(callee.text) && !isShadowed(callee, callee.text) ? stateHookImports.get(callee.text) : undefined
        const namespaced = ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && reactNamespaceImports.has(callee.expression.text) && CHECKED.has(callee.name.text) && !isShadowed(callee.expression, callee.expression.text) ? callee.name.text : undefined
        const hook = reactHookCallName(checker, node) ?? direct ?? namespaced
        if (hook && !isAllowedInTier(tier, hook)) report(file, hookProblem(hook))
      }
    }
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(sourceFile, visit)
}

for (const file of walk(src)) {
  const sourcePath = toSourcePath(file)
  const name = basename(file)
  const [topLevel] = sourcePath.split("/")
  const tier = TIERS.includes(topLevel) ? topLevel : undefined

  if (tier && isStoryFile(name)) {
    stories += 1
    continue
  }
  if (isTestFile(name) || EXCEPTIONS.has(sourcePath)) continue

  if (!tier) {
    if (isComponentFile(name)) report(file, "component outside a tier folder")
    else if (topLevel === COPY && isTierSourceFile(name)) inspectCopySource(file)
    continue
  }

  if (!isTierSourceFile(name)) continue
  if (isComponentFile(name)) {
    components += 1
    const story = join(dirname(file), name.replace(/\.(tsx|jsx)$/, ".stories.$1"))
    if (!existsSync(story)) report(file, `no sibling ${basename(story)}`)
  }
  tierSources.push({ file, tier })
}

if (typeof ts.createSourceFile !== "function" || typeof ts.createProgram !== "function") {
  if (problems.length === 0) {
    problems.push("check-tiers: TypeScript compiler API is unavailable")
  }
} else {
  const program = ts.createProgram(tierSources.map(({ file }) => file), {
    allowJs: true,
    baseUrl: webRoot,
    checkJs: false,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    paths: { react: ["node_modules/@types/react/index.d.ts"], "@/*": [join(src, "*")] },
    skipLibCheck: true,
    target: ts.ScriptTarget.Latest,
  })
  const checker = program.getTypeChecker()
  for (const { file, tier } of tierSources) inspectTierSource(file, tier, checker, program)
}

const where = relative(process.cwd(), src) || "."
const summary = `${components} components, ${stories} story files`

if (problems.length > 0) {
  console.error(`check-tiers: ${problems.length} problem(s) (${summary})\n` + problems.sort().map((problem) => `  ${problem}`).join("\n"))
  process.exit(1)
}
console.log(`check-tiers: ${summary}, tiers clean (${where})`)
