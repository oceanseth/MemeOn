# MemeOn — agent working notes

Operational facts for agents working this repo. **Keep this file lean.** Long-form detail goes in `docs/`; do **not** clutter `mobile/AGENTS.md` or any `agent.md`.

## Resolver table

When you hit one of these situations, use the resolution — do not re-discover from scratch.

| Situation | Resolution | Source |
| --- | --- | --- |
| Which git base for fix branches / PRs? | Branch from **`origin/dev`**. PR base = **`dev`**. Not `main` unless explicitly requested. | Thread 2026-07-28 (oxferd) |
| What deploys where? | Push **`dev`** → GitHub Actions → **dev.memeon.ai**. Push **`production`** → **memeon.ai**. | README + Strong 2026-07-28 |
| Who merges? | **Anyone may merge green PRs to `dev`.** After merge, smoke-test **dev.memeon.ai** before the next bead. Promote **`dev` → `production`** only via PR that **Strong alone** can approve. | Strong 2026-08-01 |
| Bead run order | **Serial.** Finish one bead (PR → merge to `dev` → test dev.memeon.ai) before starting the next. Do not parallelize workflow runs. | Strong 2026-08-01 |
| Local deploy / AWS CLI from laptop? | **Do not deploy from local.** Project AWS is not authenticated for local agents. Deploys use **GitHub secrets** only. | Strong 2026-07-28 → [docs/ENV_AND_DEPLOY.md](docs/ENV_AND_DEPLOY.md) |
| Local API testing env? | Local / `local-server` should hit **dev or local** resources, never production. | Strong 2026-07-28 → [docs/ENV_AND_DEPLOY.md](docs/ENV_AND_DEPLOY.md) |
| `api/src/env.ts` defaults look like production | Documented footgun only. **mo-100.13 deferred/closed** (Strong 2026-08-01): CI injects env; local never deploys. Do not open a PR for this unless policy changes. | Strong 2026-08-01 → [docs/ENV_AND_DEPLOY.md](docs/ENV_AND_DEPLOY.md) |
| Repo checkout path | Canonical clone: **`/Users/lou/gts/MemeOn`**. Symlink **`~/memeon`** → same path for older docs/workflows. | Host layout 2026-08-01 |
| Terraform vs live prod | README: prod has been mutated via AWS CLI; terraform in-repo is documentation-ish. **Re-import before apply.** | [README.md](README.md) Environments / infra notes |
| Static-analysis fix track | Epic **`mo-100`** in beads (`bd list` / `bd show mo-100`). **One bead → one PR.** Workflow: **`memeon-bead-pr`**. | `.beads/`, `.grok/workflows/memeon-bead-pr.rhai` |
| Planner / implementer / verifier | **Never the same agent role for a bead.** Planner (read-only) → implementer (code) → verifier (adversarial) → separate PR opener. | oxferd 2026-07-28 |
| Strong’s fix priority | **Full-catalog `listMemes` on hot paths first** (`mo-100.1`). Other listed issues still real/simple; money races + SSRF stay P0 integrity. | Strong 2026-07-28 |
| Discord search `listMemes` | Fixed in **mo-100.1** (PR #5): binder-first + semantic + paged lexical; no unbounded `listMemes` on Discord path. | mo-100.1 2026-08-01 |
| GitHub push / PR from this host | **`lmist` is READ-only** on `oceanseth/MemeOn`. Use **`gh auth switch --user oxfern`** (WRITE) then push with `https://x-access-token:$(gh auth token)@github.com/oceanseth/MemeOn.git` if osxkeychain still injects lmist. | Host auth 2026-08-01 |
| Agent roles on this track | **goosey** orchestrates + status pings this thread. **whales** = heavy implement/verify muscle. Serial beads still apply — do not parallelize beads. | oxferd 2026-08-01 |
| Who can call `POST /api/admin/frames`? | Only subs listed in Lambda env **`ADMIN_SUBS`** (comma-separated). Empty = fail-closed (403 everyone). Offline frame gen: `api/scripts/generate-frames.ts`. | mo-100.6 |
| Outbound URL fetch (OG / resolve-image) | Use **`safeFetch` / `assertPublicUrl`** (`api/src/safeFetch.ts`) — never raw `fetch` with `redirect: 'follow'` to user URLs. | mo-100.5 |
| Where do long docs live? | `docs/` for runbooks; `shared/`, `api/`, `web/` for code; this file only for the resolver table + pointers. | oxferd 2026-07-28 |

## Pointers

| Path | What |
| --- | --- |
| [docs/ENV_AND_DEPLOY.md](docs/ENV_AND_DEPLOY.md) | Env matrix, CI deploy path, no local deploy |
| [docs/STATIC_ANALYSIS_TRACK.md](docs/STATIC_ANALYSIS_TRACK.md) | Epic mo-100 bead map + workflow FSM |
| [README.md](README.md) | Product layout, auth, environments table |
| `.grok/workflows/memeon-bead-pr.rhai` | Approved bead→PR pipeline (planner ≠ implementer ≠ verifier) |
| `bd show mo-100` | Epic + children for the fix track |

## How to append

New repo learnings: **one row** in the resolver table + optional deeper page under `docs/`. Never dump narrative into this file.
