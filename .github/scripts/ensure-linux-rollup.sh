#!/usr/bin/env bash
# Validate the native Rollup binary installed for Vite by pnpm. Resolving from
# Vite keeps this independent of pnpm's virtual-store layout.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

node <<'NODE'
const fs = require('node:fs')
const { createRequire } = require('node:module')

const requireFromRoot = createRequire(process.cwd() + '/')
const vitePackage = requireFromRoot.resolve('vite/package.json', { paths: ['web'] })
const requireFromVite = createRequire(vitePackage)
const rollupPackage = requireFromVite.resolve('rollup/package.json')
const requireFromRollup = createRequire(rollupPackage)
const rollup = requireFromRollup('./package.json')
const nativePackages = {
  'darwin:arm64': '@rollup/rollup-darwin-arm64',
  'darwin:x64': '@rollup/rollup-darwin-x64',
  'linux:arm64': '@rollup/rollup-linux-arm64-gnu',
  'linux:x64': '@rollup/rollup-linux-x64-gnu',
}
const nativePackageName = nativePackages[`${process.platform}:${process.arch}`]
if (!nativePackageName) {
  throw new Error(`Unsupported Rollup platform: ${process.platform}:${process.arch}`)
}
const nativePackage = requireFromRollup.resolve(`${nativePackageName}/package.json`)
const native = require(nativePackage)
const binary = requireFromRollup.resolve(nativePackageName)

if (rollup.version !== native.version) {
  throw new Error(`Rollup and its native package must match; got rollup=${rollup.version}, native=${native.version}`)
}
if (!binary.endsWith('.node') || !fs.existsSync(binary)) {
  throw new Error(`Rollup native package main must be an installed .node file: ${binary}`)
}
require(binary)
console.log(`Loaded Rollup native package ${native.version}`)
NODE
