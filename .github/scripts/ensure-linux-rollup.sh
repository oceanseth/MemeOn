#!/usr/bin/env bash
# Unpack the Linux Rollup native binary without `npm install --prefix web`.
# A prefix install re-resolves web/package.json and can ERESOLVE against
# lockfile versions (see mo-ri6 / Deploy dev 34688421391).
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

expected='4.53.2'
tmp_base="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
rollup_tmp="$(mktemp -d "$tmp_base/rollup-native.XXXXXX")"
trap 'rm -rf "$rollup_tmp"' EXIT

cd "$rollup_tmp"
npm pack --ignore-scripts --silent "@rollup/rollup-linux-x64-gnu@${expected}"
rollup_dest="$repo_root/web/node_modules/@rollup/rollup-linux-x64-gnu"
mkdir -p "$rollup_dest"
tar -xzf "rollup-rollup-linux-x64-gnu-${expected}.tgz" --strip-components=1 -C "$rollup_dest"
cd "$repo_root"

node <<NODE
const fs = require('node:fs')
const path = require('node:path')

const expected = '${expected}'
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'))
const locked = lock.packages?.['web/node_modules/rollup']?.version
const rollup = require(path.resolve('web/node_modules/rollup/package.json'))
const nativeRoot = path.resolve('web/node_modules/@rollup/rollup-linux-x64-gnu')
const native = require(path.join(nativeRoot, 'package.json'))
const binary = path.resolve(nativeRoot, native.main)

if (locked !== expected || rollup.version !== expected || native.version !== expected) {
  throw new Error(\`Rollup versions must all be \${expected}; got lock=\${locked}, rollup=\${rollup.version}, native=\${native.version}\`)
}
if (!binary.startsWith(\`\${nativeRoot}\${path.sep}\`) || path.extname(binary) !== '.node' || !fs.existsSync(binary)) {
  throw new Error(\`Rollup native package main must be an installed .node file: \${binary}\`)
}
require(binary)
console.log(\`Loaded Linux Rollup native package \${native.version}\`)
NODE
