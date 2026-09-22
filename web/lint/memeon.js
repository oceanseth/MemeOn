/**
 * The repo's own oxlint rules, loaded beside `@shadcn/lint` by `.oxlintrc.json`.
 *
 * `no-native-chrome` is the one thing the shadcn rules structurally cannot see. Every one of them
 * reads classes we wrote — a raw colour, an unknown class, an inline style, a caller restyling an
 * atom. A control the *browser* draws has no classes to read: `<input type="file">` is zero
 * violations and a form row reading "Choose File / No file chosen", in the user agent's locale,
 * at a width no stylesheet can set, past every gate `copy/` exists to hold.
 *
 * Three signals, all of them "the browser decides what this looks like":
 *
 * 1. A chrome input type — `file`, `color`, `date`, `datetime-local`, `month`, `range`, `time`,
 *    `week`, `checkbox`, `radio`. Read from JSX (`<Input type="file">`) and from an input-prop
 *    object (`*InputProps`, or a control sibling key), not every `{ type: 'file' }`. The bag is
 *    built in `lib/createMemeModel/` and spread — invisible to any rule that only walks JSX.
 * 2. A user-agent element — `<select>`, `<option>`, `<progress>`, `<details>`, `<dialog>`…, each
 *    of which has an atom that replaces it.
 * 3. A user-agent dialog — `alert()`, `confirm()`, `prompt()`: a modal in the browser's chrome,
 *    with the browser's buttons.
 *
 * `no-use-effect` is the other local law: never call `useEffect` / `useLayoutEffect`. Derive the
 * value, handle the event, use a query, or call `useMountEffect` for mount-only external sync.
 * The wrapper itself lives in `hooks/useMountEffect.ts` and is the one override for this rule.
 *
 * Exceptions are `overrides` entries in `.oxlintrc.json`, scoped to a file, with the reason in the
 * `note` beside them. Two: `atoms/file-drop.tsx`, where the native input is still the thing that
 * opens the OS dialog — it just may not be seen; and `hooks/useMountEffect.ts`, the mount-only
 * wrapper around `useEffect`.
 */

/** Input types whose widget — and, for several, whose sentence — the user agent owns. */
const CHROME_TYPES = new Map([
  ['file', 'atoms/file-drop'],
  ['checkbox', 'atoms/checkbox'],
  ['radio', 'atoms/toggle-group'],
  ['color', 'a control of our own'],
  ['date', 'a control of our own'],
  ['datetime-local', 'a control of our own'],
  ['month', 'a control of our own'],
  ['range', 'a control of our own'],
  ['time', 'a control of our own'],
  ['week', 'a control of our own'],
])

/** Binding names that own an input prop object: InputProps or inputProps. */
const INPUT_PROPS_NAME = /[Ii]nputProps$/

/** Static control keys. id, name, and value are not control keys. */
const INPUT_SIBLING_KEYS = new Set([
  'accept',
  'multiple',
  'capture',
  'webkitdirectory',
  'checked',
  'defaultChecked',
  'onChange',
  'onInput',
  'onBlur',
  'onFocus',
  'onKeyDown',
  'placeholder',
  'readOnly',
  'required',
  'min',
  'max',
  'step',
])

/** `as` / `satisfies` / assertion / parens between an object and the binding that owns it. */
const INPUT_BAG_WRAPPERS = new Set([
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
  'ParenthesizedExpression',
])

/** Elements the user agent paints, and what stands in for each here. */
const UA_ELEMENTS = new Map([
  ['select', 'atoms/select'],
  ['option', 'atoms/select'],
  ['optgroup', 'atoms/select'],
  ['progress', 'atoms/progress'],
  ['meter', 'atoms/progress'],
  ['details', 'atoms/collapsible'],
  ['summary', 'atoms/collapsible'],
  ['dialog', 'atoms/dialog'],
  ['marquee', 'nothing at all'],
])

const UA_DIALOGS = new Map([
  ['alert', 'atoms/alert-dialog'],
  ['confirm', 'molecules/confirm-dialog'],
  ['prompt', 'atoms/dialog'],
])

const GLOBALS = new Set(['window', 'globalThis', 'self'])

const EFFECT_HOOKS = new Set(['useEffect', 'useLayoutEffect'])

/** A string literal's value, whether it is written as a literal or as a bare template. */
function stringValue(node) {
  if (!node) return null
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value
  if (node.type === 'JSXExpressionContainer') return stringValue(node.expression)
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value?.cooked ?? null
  }
  return null
}

const noNativeChrome = {
  meta: {
    type: 'problem',
    docs: {
      description: 'No control whose pixels or words belong to the browser rather than to us.',
    },
    schema: [],
    messages: {
      chromeType:
        'type="{{type}}" hands this control to the browser: its widget, its sizing, and words that never pass through copy/. Use {{fix}}.',
      element: '<{{tag}}> is painted by the user agent, not by this design system. Use {{fix}}.',
      dialog: "{{call}} opens the browser's own modal, in the browser's own words. Use {{fix}}.",
    },
  },
  create(context) {
    const reportType = (node, type) => {
      context.report({
        node,
        messageId: 'chromeType',
        data: { type, fix: CHROME_TYPES.get(type) },
      })
    }

    return {
      JSXOpeningElement(node) {
        const tag = node.name.type === 'JSXIdentifier' ? node.name.name : null
        if (tag && UA_ELEMENTS.has(tag)) {
          context.report({
            node,
            messageId: 'element',
            data: { tag, fix: UA_ELEMENTS.get(tag) },
          })
        }
        for (const attribute of node.attributes) {
          if (attribute.type !== 'JSXAttribute') continue
          if (attribute.name.type !== 'JSXIdentifier' || attribute.name.name !== 'type') continue
          const value = stringValue(attribute.value)
          if (value && CHROME_TYPES.has(value)) reportType(attribute, value)
        }
      },

      /* an input-prop object (*InputProps, or a control sibling key), not every { type: 'file' } */
      Property(node) {
        const key = node.computed ? stringValue(node.key) : identifierName(node.key)
        if (key !== 'type') return
        const value = stringValue(node.value)
        if (!value || !CHROME_TYPES.has(value)) return
        const objectNode = node.parent
        if (!objectNode || objectNode.type !== 'ObjectExpression') return
        if (!hasInputSibling(objectNode, node) && !feedsInput(objectNode)) return
        reportType(node, value)
      },

      CallExpression(node) {
        const callee = node.callee
        if (
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          GLOBALS.has(callee.object.name)
        ) {
          // Computed keys go through stringValue only. identifierName would treat window[confirm] as confirm.
          const name = callee.computed
            ? stringValue(callee.property)
            : callee.property.type === 'Identifier'
              ? callee.property.name
              : null
          if (name && UA_DIALOGS.has(name)) {
            context.report({
              node,
              messageId: 'dialog',
              data: {
                call: `${callee.object.name}.${name}()`,
                fix: UA_DIALOGS.get(name),
              },
            })
            return
          }
        }
        if (callee.type !== 'Identifier' || !UA_DIALOGS.has(callee.name)) return
        // a local binding of the same name is somebody's helper, not the browser's dialog
        const scope = context.sourceCode?.getScope?.(node)
        for (let current = scope; current; current = current.upper) {
          if (current.variables?.some((variable) => variable.name === callee.name)) return
        }
        context.report({
          node,
          messageId: 'dialog',
          data: { call: `${callee.name}()`, fix: UA_DIALOGS.get(callee.name) },
        })
      },
    }
  },
}

const identifierName = (node) => {
  if (!node) return null
  if (node.type === 'Identifier') return node.name
  if (node.type === 'JSXIdentifier') return node.name
  return stringValue(node)
}

function hasInputSibling(objectNode, property) {
  for (const prop of objectNode.properties) {
    if (prop === property || prop.type !== 'Property') continue
    const key = prop.computed ? stringValue(prop.key) : identifierName(prop.key)
    if (typeof key === 'string' && INPUT_SIBLING_KEYS.has(key)) return true
  }
  return false
}

/** One step above the object. Identity uses the outermost wrapper, not the inner object. */
function feedsInput(objectNode) {
  let node = objectNode
  while (node.parent && INPUT_BAG_WRAPPERS.has(node.parent.type)) node = node.parent
  const parent = node.parent
  if (!parent) return false
  if (
    (parent.type === 'Property' || parent.type === 'PropertyDefinition') &&
    parent.value === node
  ) {
    const key = parent.computed ? stringValue(parent.key) : identifierName(parent.key)
    return typeof key === 'string' && INPUT_PROPS_NAME.test(key)
  }
  if (
    parent.type === 'VariableDeclarator' &&
    parent.init === node &&
    parent.id.type === 'Identifier'
  ) {
    return INPUT_PROPS_NAME.test(parent.id.name)
  }
  if (
    parent.type === 'AssignmentExpression' &&
    parent.right === node &&
    parent.left.type === 'Identifier'
  ) {
    return INPUT_PROPS_NAME.test(parent.left.name)
  }
  if (parent.type === 'JSXSpreadAttribute' && parent.argument === node) {
    const opening = parent.parent
    return (
      opening?.type === 'JSXOpeningElement' &&
      opening.name.type === 'JSXIdentifier' &&
      (opening.name.name === 'input' || opening.name.name === 'Input')
    )
  }
  return false
}

const noUseEffect = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Do not call useEffect or useLayoutEffect. Derive state, handle the event, or use useMountEffect.',
    },
    schema: [],
    messages: {
      used: 'Do not {{kind}} `{{name}}`. Derive state, handle the event, use a query, or call `useMountEffect` for mount-only external sync.',
    },
  },
  create(context) {
    const report = (node, name, kind) => {
      context.report({ node, messageId: 'used', data: { name, kind } })
    }

    const reportIfEffect = (node, name, kind) => {
      if (name && EFFECT_HOOKS.has(name)) report(node, name, kind)
    }

    // Nearest binding wins, even when that binding is not React's hook.
    const resolveVariable = (identifier) => {
      for (
        let current = context.sourceCode?.getScope?.(identifier);
        current;
        current = current.upper
      ) {
        const found = current.variables?.find((variable) => variable.name === identifier.name)
        if (found) return found
      }
      return null
    }

    const isTypeImport = (node) => node?.importKind === 'type'

    const reactModuleVariable = (identifier) => {
      const variable = resolveVariable(identifier)
      for (const def of variable?.defs ?? []) {
        const spec = def.node
        if (def.type !== 'ImportBinding') continue
        if (spec?.type !== 'ImportDefaultSpecifier' && spec?.type !== 'ImportNamespaceSpecifier') {
          continue
        }
        if (isTypeImport(spec) || isTypeImport(def.parent)) continue
        if (def.parent?.source?.value === 'react') return true
      }
      return false
    }

    const reactEffectImport = (variable) => {
      for (const def of variable?.defs ?? []) {
        const spec = def.node
        if (def.type !== 'ImportBinding' || spec?.type !== 'ImportSpecifier') continue
        if (isTypeImport(spec) || isTypeImport(def.parent)) continue
        if (def.parent?.source?.value !== 'react') continue
        const exported = identifierName(spec.imported)
        if (exported && EFFECT_HOOKS.has(exported)) return exported
      }
      return null
    }

    const boundName = (value) => {
      const id = value?.type === 'AssignmentPattern' ? value.left : value
      return id?.type === 'Identifier' ? id.name : null
    }

    const reactPatternEffect = (variable) => {
      for (const def of variable?.defs ?? []) {
        const declarator = def.node
        if (def.type !== 'Variable' || declarator?.type !== 'VariableDeclarator') continue
        if (declarator.id?.type !== 'ObjectPattern') continue
        if (declarator.init?.type !== 'Identifier' || !reactModuleVariable(declarator.init))
          continue
        for (const prop of declarator.id.properties) {
          if (prop.type !== 'Property' || boundName(prop.value) !== variable.name) continue
          const key = prop.computed ? stringValue(prop.key) : identifierName(prop.key)
          if (key && EFFECT_HOOKS.has(key)) return key
        }
      }
      return null
    }

    const reportReactMember = (node) => {
      if (node.object?.type !== 'Identifier' || !reactModuleVariable(node.object)) return
      const name = node.computed ? stringValue(node.property) : identifierName(node.property)
      reportIfEffect(node.property, name, 'call')
    }

    return {
      ImportDeclaration(node) {
        if (node.source?.value !== 'react' || isTypeImport(node)) return
        for (const spec of node.specifiers) {
          if (spec.type !== 'ImportSpecifier' || isTypeImport(spec)) continue
          reportIfEffect(spec, identifierName(spec.imported), 'import')
        }
      },

      MemberExpression: reportReactMember,

      OptionalMemberExpression: reportReactMember,

      CallExpression(node) {
        if (node.callee.type !== 'Identifier') return
        const variable = resolveVariable(node.callee)
        reportIfEffect(
          node.callee,
          reactEffectImport(variable) || reactPatternEffect(variable),
          'call',
        )
      },

      VariableDeclarator(node) {
        if (node.id.type !== 'ObjectPattern') return
        if (node.init?.type !== 'Identifier' || !reactModuleVariable(node.init)) return
        for (const prop of node.id.properties) {
          if (prop.type !== 'Property') continue
          const name = prop.computed ? stringValue(prop.key) : identifierName(prop.key)
          reportIfEffect(prop, name, 'bind')
        }
      },
    }
  },
}

export default {
  meta: { name: 'memeon' },
  rules: { 'no-native-chrome': noNativeChrome, 'no-use-effect': noUseEffect },
}
