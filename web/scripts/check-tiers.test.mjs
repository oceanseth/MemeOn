import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import test from "node:test"

const checker = resolve(import.meta.dirname, "check-tiers.mjs")

const runChecker = (files) => {
  const src = mkdtempSync(join(tmpdir(), "memeon-tier-check-"))
  try {
    for (const [path, contents] of Object.entries(files)) {
      const file = join(src, path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, contents)
    }
    const result = spawnSync(process.execPath, [checker, src], { encoding: "utf8" })
    return { status: result.status, output: result.stdout + result.stderr }
  } finally {
    rmSync(src, { recursive: true, force: true })
  }
}

const story = "export default {}\n"
const component = "export function Example() { return <div /> }\n"

test("rejects AST-recognized nested state, value edges, state libraries, missing stories, and flat components", () => {
  const result = runChecker({
    "atoms/nested/Stateful.tsx": "import { useState } from 'react'\nexport function Stateful() { const [value] = useState(0); return <div>{value}</div> }\n",
    "atoms/nested/Stateful.stories.tsx": story,
    "atoms/nested/GenericState.tsx": "import { useState } from 'react'\nexport function GenericState() { const [value] = useState<number>(0); return <div>{value}</div> }\n",
    "atoms/nested/GenericState.stories.tsx": story,
    "atoms/nested/AliasedState.tsx": "import { useState as state } from 'react'\nexport function AliasedState() { const [value] = state(0); return <div>{value}</div> }\n",
    "atoms/nested/AliasedState.stories.tsx": story,
    "atoms/nested/NamespacedState.tsx": "import * as React from 'react'\nexport function NamespacedState() { const [value] = React.useState<number>(0); return <div>{value}</div> }\n",
    "atoms/nested/NamespacedState.stories.tsx": story,
    "atoms/nested/Upward.tsx": "import { Molecule } from '../../molecules/Molecule'\nexport function Upward() { return <Molecule /> }\n",
    "atoms/nested/Upward.stories.tsx": story,
    "atoms/nested/SameLineUpward.tsx": "import React from 'react'; import { Molecule } from '../../molecules/Molecule'\nexport function SameLineUpward() { return <React.Fragment><Molecule /></React.Fragment> }\n",
    "atoms/nested/SameLineUpward.stories.tsx": story,
    "atoms/nested/ValueReexport.tsx": "export { Molecule as ValueReexport } from '../../molecules/Molecule'\n",
    "atoms/nested/ValueReexport.stories.tsx": story,
    "atoms/nested/StarReexport.tsx": "export * from '../../molecules/Molecule'\n",
    "atoms/nested/StarReexport.stories.tsx": story,
    "molecules/Molecule.tsx": "export function Molecule() { return <div /> }\n",
    "molecules/Molecule.stories.tsx": story,
    "molecules/nested/StateLibrary.tsx": "import { create } from 'zustand'\nexport function StateLibrary() { return <div /> }\n",
    "molecules/nested/StateLibrary.stories.tsx": story,
    "molecules/nested/SideEffectStateLibrary.tsx": "import 'mobx'\nexport function SideEffectStateLibrary() { return <div /> }\n",
    "molecules/nested/SideEffectStateLibrary.stories.tsx": story,
    "molecules/nested/DynamicStateLibrary.tsx": "export const load = () => import('mobx')\nexport function DynamicStateLibrary() { return <div /> }\n",
    "molecules/nested/DynamicStateLibrary.stories.tsx": story,
    "molecules/nested/Unstoried.tsx": component,
    "atoms/nested/state.ts": "import { observable } from 'mobx'\nexport const state = observable({ value: 0 })\n",
    "components/Forgotten.tsx": component,
  })

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /atoms\/nested\/Stateful\.tsx: React state hook below views/)
  assert.match(result.output, /atoms\/nested\/GenericState\.tsx: React state hook below views/)
  assert.match(result.output, /atoms\/nested\/AliasedState\.tsx: React state hook below views/)
  assert.match(result.output, /atoms\/nested\/NamespacedState\.tsx: React state hook below views/)
  assert.match(result.output, /atoms\/nested\/Upward\.tsx: atoms imports from molecules/)
  assert.match(result.output, /atoms\/nested\/SameLineUpward\.tsx: atoms imports from molecules/)
  assert.match(result.output, /atoms\/nested\/ValueReexport\.tsx: atoms imports from molecules/)
  assert.match(result.output, /atoms\/nested\/StarReexport\.tsx: atoms imports from molecules/)
  assert.match(result.output, /molecules\/nested\/StateLibrary\.tsx: imports state library "zustand" below views/)
  assert.match(result.output, /molecules\/nested\/SideEffectStateLibrary\.tsx: imports state library "mobx" below views/)
  assert.match(result.output, /molecules\/nested\/DynamicStateLibrary\.tsx: imports state library "mobx" below views/)
  assert.match(result.output, /atoms\/nested\/state\.ts: imports state library "mobx" below views/)
  assert.match(result.output, /molecules\/nested\/Unstoried\.tsx: no sibling Unstoried\.stories\.tsx/)
  assert.match(result.output, /components\/Forgotten\.tsx: component outside a tier folder/)
})

test("allows nested tier components, type-only imports, exact integration files, and JSX-free domain modules", () => {
  const result = runChecker({
    "atoms/nested/Good.tsx": component,
    "atoms/nested/Good.stories.tsx": story,
    "screens/nested/GoodScreen.tsx": "import type { GoodModel } from '../../hooks/useGoodScreen'\nexport function GoodScreen(_props: GoodModel) { return <div /> }\n",
    "screens/nested/GoodScreen.stories.tsx": story,
    "hooks/useGoodScreen.ts": "export type GoodModel = { label: string }\n",
    "hooks/useAnotherGoodScreen.ts": "export type AnotherGoodModel = { label: string }\n",
    "screens/nested/AnotherGoodScreen.tsx": "import { type AnotherGoodModel } from '../../hooks/useAnotherGoodScreen'\nexport function AnotherGoodScreen(_props: AnotherGoodModel) { return <div /> }\n",
    "screens/nested/AnotherGoodScreen.stories.tsx": story,
    "screens/nested/CommentTypeOnlyScreen.tsx": "import { /* props only */ type GoodModel } from '../../hooks/useGoodScreen'\nexport function CommentTypeOnlyScreen(_props: GoodModel) { return <div /> }\n",
    "screens/nested/CommentTypeOnlyScreen.stories.tsx": story,
    "screens/nested/TypeReexport.tsx": "export type { GoodModel } from '../../hooks/useGoodScreen'\nexport function TypeReexport() { return <div /> }\n",
    "screens/nested/TypeReexport.stories.tsx": story,
    "atoms/nested/WordsOnly.tsx": "// A former implementation called useState(0).\nexport function WordsOnly() { return <code>useState(0)</code> }\n",
    "atoms/nested/WordsOnly.stories.tsx": story,
    "lib/domain.ts": "export const label = (value) => value.toUpperCase()\n",
    "components/Ignored.test.tsx": component,
    "components/Ignored.spec.tsx": component,
    "components/Ignored.stories.tsx": story,
    "components/HeroVideo.tsx": "export function HeroVideo() { return <div /> }\n",
    "pages/AuthCallback.tsx": "export function AuthCallback() { return <div /> }\n",
    "pages/MobileAuthForward.tsx": "export function MobileAuthForward() { return <div /> }\n",
    "context/AuthContext.tsx": "export const AuthContext = null\n",
    "stories/Button.tsx": component,
    "stories/Header.tsx": component,
    "stories/Page.tsx": component,
    "main.tsx": "export function Root() { return <div /> }\n",
    "stores/StoresContext.tsx": "export function StoresProvider() { return <div /> }\n",
  })

  assert.equal(result.status, 0, result.output)
})

test("resolves React aliases and re-exports without mistaking a shadowed binding for a hook", () => {
  const result = runChecker({
    "atoms/nested/DefaultAlias.tsx": "import { default as R } from 'react'\nexport function DefaultAlias() { const [value] = R.useState(0); return <div>{value}</div> }\n",
    "atoms/nested/DefaultAlias.stories.tsx": story,
    "atoms/nested/Destructured.tsx": "import React from 'react'\nconst { useState } = React\nexport function Destructured() { const [value] = useState(0); return <div>{value}</div> }\n",
    "atoms/nested/Destructured.stories.tsx": story,
    "atoms/nested/react.ts": "export { useState } from 'react'\n",
    "atoms/nested/Reexported.tsx": "import { useState } from './react'\nexport function Reexported() { const [value] = useState(0); return <div>{value}</div> }\n",
    "atoms/nested/Reexported.stories.tsx": story,
    "atoms/nested/barrel.ts": "export * from './react'\n",
    "atoms/nested/StarReexported.tsx": "import { useState } from './barrel'\nexport function StarReexported() { const [value] = useState(0); return <div>{value}</div> }\n",
    "atoms/nested/StarReexported.stories.tsx": story,
    "atoms/nested/pure.ts": "export const clamp = (value: number) => Math.max(0, value)\n",
    "atoms/nested/pure-barrel.ts": "export * from './pure'\n",
    "atoms/nested/PureBarrel.tsx": "import { clamp } from './pure-barrel'\nexport function PureBarrel() { return <div>{clamp(1)}</div> }\n",
    "atoms/nested/PureBarrel.stories.tsx": story,
    "atoms/nested/Parenthesized.tsx": "import { useState } from 'react'\nexport function Parenthesized() { const [value] = (useState)(0); return <div>{value}</div> }\n",
    "atoms/nested/Parenthesized.stories.tsx": story,
    "atoms/nested/DynamicTemplate.tsx": "export const load = () => import(`mobx`)\nexport function DynamicTemplate() { return <div /> }\n",
    "atoms/nested/DynamicTemplate.stories.tsx": story,
    "atoms/nested/HooksTemplate.tsx": "export const load = () => import(`../../hooks/model`)\nexport function HooksTemplate() { return <div /> }\n",
    "atoms/nested/HooksTemplate.stories.tsx": story,
    "atoms/nested/Shadowed.tsx": "import { useState as state } from 'react'\nexport type StateHook = typeof state\nexport function Shadowed({ state }: { state: () => number }) { return <div>{state()}</div> }\n",
    "atoms/nested/Shadowed.stories.tsx": story,
  })

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /atoms\/nested\/DefaultAlias\.tsx: React state hook below views/)
  assert.match(result.output, /atoms\/nested\/Destructured\.tsx: React state hook below views/)
  assert.match(result.output, /atoms\/nested\/Reexported\.tsx: React state hook below views/)
  assert.match(result.output, /atoms\/nested\/StarReexported\.tsx: React state hook below views/)
  assert.match(result.output, /atoms\/nested\/Parenthesized\.tsx: React state hook below views/)
  assert.match(result.output, /atoms\/nested\/DynamicTemplate\.tsx: imports state library "mobx" below views/)
  assert.match(result.output, /atoms\/nested\/HooksTemplate\.tsx: atoms imports from hooks/)
  assert.doesNotMatch(result.output, /Shadowed\.tsx: React state hook below views/)
  assert.doesNotMatch(result.output, /PureBarrel\.tsx: React state hook below views/)
})

test("does not let a commented default import hide a runtime hooks edge", () => {
  const result = runChecker({
    "atoms/nested/RuntimeImport.tsx": "import /* model */ useModel, { type Model } from '../../hooks/useModel'\nexport function RuntimeImport(_props: Model) { return <div>{useModel()}</div> }\n",
    "atoms/nested/RuntimeImport.stories.tsx": story,
    "hooks/useModel.ts": "export type Model = {}\nexport default function useModel() { return 1 }\n",
  })

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /atoms\/nested\/RuntimeImport\.tsx: atoms imports from hooks/)
})

test("rejects new components adjacent to an exact exception", () => {
  const result = runChecker({
    "components/HeroVideo.tsx": component,
    "components/HeroVideoControls.tsx": component,
    "pages/AuthCallback.tsx": component,
    "pages/AccountRecovery.tsx": component,
    "hooks/useUnlisted.tsx": component,
    "stores/UnlistedProvider.tsx": component,
    "lib/Unlisted.tsx": component,
  })

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /components\/HeroVideoControls\.tsx: component outside a tier folder/)
  assert.match(result.output, /pages\/AccountRecovery\.tsx: component outside a tier folder/)
  assert.match(result.output, /hooks\/useUnlisted\.tsx: component outside a tier folder/)
  assert.match(result.output, /stores\/UnlistedProvider\.tsx: component outside a tier folder/)
  assert.match(result.output, /lib\/Unlisted\.tsx: component outside a tier folder/)
})
