import { spawnSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

export const writeFiles = (dir, files) => {
  for (const [rel, contents] of Object.entries(files)) {
    const file = join(dir, rel)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, contents)
  }
}

export const runChecker = (checker, dir, files, extraArgs = []) => {
  writeFiles(dir, files)
  const result = spawnSync(process.execPath, [checker, dir, ...extraArgs], { encoding: "utf8" })
  return { status: result.status, output: result.stdout + result.stderr }
}
