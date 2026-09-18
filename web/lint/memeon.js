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
 *    `week`, `checkbox`, `radio`. Read from JSX (`<Input type="file">`) *and* from object
 *    literals (`{ type: 'file' }`), because the way this one reached the screen was a prop bag
 *    built in `lib/createMemeModel/` and spread — invisible to any rule that only walks JSX.
 * 2. A user-agent element — `<select>`, `<option>`, `<progress>`, `<details>`, `<dialog>`…, each
 *    of which has an atom that replaces it.
 * 3. A user-agent dialog — `alert()`, `confirm()`, `prompt()`: a modal in the browser's chrome,
 *    with the browser's buttons.
 *
 * Exceptions are `overrides` entries in `.oxlintrc.json`, scoped to a file, with the reason in the
 * `note` beside them. There is one: `atoms/file-drop.tsx`, where the native input is still the
 * thing that opens the OS dialog — it just may not be seen.
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
      element:
        '<{{tag}}> is painted by the user agent, not by this design system. Use {{fix}}.',
      dialog:
        '{{call}} opens the browser\'s own modal, in the browser\'s own words. Use {{fix}}.',
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
          context.report({ node, messageId: 'element', data: { tag, fix: UA_ELEMENTS.get(tag) } })
        }
        for (const attribute of node.attributes) {
          if (attribute.type !== 'JSXAttribute') continue
          if (attribute.name.type !== 'JSXIdentifier' || attribute.name.name !== 'type') continue
          const value = stringValue(attribute.value)
          if (value && CHROME_TYPES.has(value)) reportType(attribute, value)
        }
      },

      /* the prop bag a builder returns and a screen spreads — how the file input got in */
      Property(node) {
        if (node.computed) return
        const key =
          node.key.type === 'Identifier'
            ? node.key.name
            : node.key.type === 'Literal'
              ? node.key.value
              : null
        if (key !== 'type') return
        const value = stringValue(node.value)
        if (value && CHROME_TYPES.has(value)) reportType(node, value)
      },

      CallExpression(node) {
        const callee = node.callee
        if (
          callee.type === 'MemberExpression' &&
          !callee.computed &&
          callee.object.type === 'Identifier' &&
          GLOBALS.has(callee.object.name) &&
          callee.property.type === 'Identifier' &&
          UA_DIALOGS.has(callee.property.name)
        ) {
          const name = callee.property.name
          context.report({
            node,
            messageId: 'dialog',
            data: { call: `${callee.object.name}.${name}()`, fix: UA_DIALOGS.get(name) },
          })
          return
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

export default {
  meta: { name: 'memeon' },
  rules: { 'no-native-chrome': noNativeChrome },
}
