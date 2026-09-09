#!/usr/bin/env node
/**
 * Structural check for a molecularized React `src/`.
 *
 *   node scripts/check-tiers.mjs [srcDir]
 *
 * Fails (exit 1) on:
 *   - a value import or re-export from a higher tier, or hooks/ or stores/, below views/
 *   - a React state hook in a component or helper below views/
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
const ALLOWED = {
  atoms: ["atoms"],
  molecules: ["atoms", "molecules"],
  organisms: ["atoms", "molecules", "organisms"],
  screens: ["atoms", "molecules", "organisms", "screens"],
  views: [...TIERS, ...ENGINES],
}
const STATE_HOOKS = new Set(["useState", "useReducer", "useEffect", "useLayoutEffect", "useContext", "useSyncExternalStore"])
const STATE_LIBS = /^(mobx|mobx-react(-lite)?|zustand|jotai|valtio|recoil|redux|@reduxjs\/toolkit|react-redux|@tanstack\/react-query|swr|@xstate\/react|xstate)(\/|$)/

// These are integration points, not tier components. Keep this list exact so a
// new .tsx file beside one of them still has to join a tier.
const EXCEPTIONS = new Map([
  ["App.tsx", "legacy route adapter pending AppView migration"],
  ["components/AlertsBell.tsx", "legacy component pending tier migration"],
  ["components/ConfirmDialog.tsx", "legacy component pending tier migration"],
  ["components/GiftDialog.tsx", "legacy component pending tier migration"],
  ["components/HeroVideo.tsx", "imperative landing-page media control"],
  ["components/Layout.tsx", "legacy shell pending tier migration"],
  ["components/MemeCard.tsx", "legacy component pending tier migration"],
  ["components/MemeplexPanel.tsx", "legacy component pending tier migration"],
  ["components/QuestBar.tsx", "legacy component pending tier migration"],
  ["components/SortChips.tsx", "legacy component pending tier migration"],
  ["pages/AuthCallback.tsx", "OAuth redirect callback"],
  ["pages/Binder.tsx", "legacy route pending screen migration"],
  ["pages/Developers.tsx", "legacy route pending screen migration"],
  ["pages/DiscordLink.tsx", "legacy route pending screen migration"],
  ["pages/DiscordPage.tsx", "legacy route pending screen migration"],
  ["pages/Friends.tsx", "legacy route pending screen migration"],
  ["pages/Invite.tsx", "legacy route pending screen migration"],
  ["pages/Landing.tsx", "legacy route pending screen migration"],
  ["pages/Leaderboard.tsx", "legacy route pending screen migration"],
  ["pages/Marketplace.tsx", "legacy route pending screen migration"],
  ["pages/MemeDetail.tsx", "legacy route pending screen migration"],
  ["pages/MobileAuthForward.tsx", "mobile deep-link redirect"],
  ["pages/Privacy.tsx", "legacy route pending screen migration"],
  ["pages/Profile.tsx", "legacy route pending screen migration"],
  ["pages/Terms.tsx", "legacy route pending screen migration"],
  ["pages/Trades.tsx", "legacy route pending screen migration"],
  ["context/AuthContext.tsx", "compatibility re-export of useAuth"],
  ["stories/Button.tsx", "Storybook CLI example"],
  ["stories/Header.tsx", "Storybook CLI example"],
  ["stories/Page.tsx", "Storybook CLI example"],
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

/** Which top-level folder under src a resolved import lands in, if any. */
const folderOf = (fromFile, spec) => {
  if (!spec.startsWith(".")) return undefined
  const target = resolve(dirname(fromFile), spec)
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
  if (!spec.startsWith(".")) return undefined
  const base = resolve(dirname(fromFile), spec)
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
      return statement.exportClause.elements.some((element) => (element.name.text === exportedName) && STATE_HOOKS.has(element.propertyName?.text ?? element.name.text))
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
  if (folder !== undefined && (TIERS.includes(folder) || ENGINES.includes(folder)) && !ALLOWED[tier].includes(folder)) {
    report(file, `${tier} imports from ${folder}/ ("${spec}")`)
  }
}

const reactDeclaration = (declaration) => /node_modules[\\/](@types[\\/]react|react)[\\/]/.test(declaration.getSourceFile().fileName)

const resolvedSymbol = (checker, node) => {
  let symbol = checker.getSymbolAtLocation(node)
  if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
  return symbol
}

const isReactHookSymbol = (symbol) => symbol && STATE_HOOKS.has(symbol.getName()) && symbol.declarations?.some(reactDeclaration)

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

const isReactDestructuredHook = (checker, symbol) => symbol?.declarations?.some((declaration) => {
  if (!ts.isBindingElement(declaration) || !ts.isObjectBindingPattern(declaration.parent)) return false
  const variable = declaration.parent.parent
  if (!ts.isVariableDeclaration(variable) || !variable.initializer) return false
  const propertyName = declaration.propertyName?.getText() ?? declaration.name.getText()
  if (!STATE_HOOKS.has(propertyName)) return false
  return ts.isIdentifier(variable.initializer) && isReactNamespaceSymbol(checker.getSymbolAtLocation(variable.initializer))
})

const isReactHookCall = (checker, call) => {
  const callee = unwrapExpression(call.expression)
  const symbol = ts.isPropertyAccessExpression(callee)
    ? resolvedSymbol(checker, callee.name)
    : resolvedSymbol(checker, callee)
  return isReactHookSymbol(symbol) || (ts.isIdentifier(callee) && isReactDestructuredHook(checker, symbol))
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
  const stateHookImports = new Set()
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
            if (STATE_HOOKS.has(importedName) && (spec === "react" || isReactHookExport(file, spec, importedName))) stateHookImports.add(binding.name.text)
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

      if (tier !== "views" && isReactHookCall(checker, node)) {
        report(file, "React state hook below views/ (lift it into hooks/ and pass a prop)")
      } else if (tier !== "views") {
        const callee = unwrapExpression(node.expression)
        const isDirectImport = ts.isIdentifier(callee) && stateHookImports.has(callee.text) && !isShadowed(callee, callee.text)
        const isNamespaceImport = ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && reactNamespaceImports.has(callee.expression.text) && STATE_HOOKS.has(callee.name.text) && !isShadowed(callee.expression, callee.expression.text)
        if (isDirectImport || isNamespaceImport) report(file, "React state hook below views/ (lift it into hooks/ and pass a prop)")
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
    paths: { react: ["node_modules/@types/react/index.d.ts"] },
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
