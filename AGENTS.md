# MemeOn — agent working notes

Operational facts for agents working this repo. **Keep this file lean.** Long-form detail goes in `docs/`; do **not** clutter `mobile/AGENTS.md` or any `agent.md`.

## Resolver table

When you hit one of these situations, use the resolution — do not re-discover from scratch.

| Situation | Resolution | Source |
| --- | --- | --- |
| Which git base for fix branches / PRs? | Branch from **`origin/dev`**. PR base = **`dev`**. Not `main` unless explicitly requested. | Thread 2026-07-28 (oxferd) |
| Finished product work sitting on local `dev`? | **Always** branch from `origin/dev`, commit, push, open a PR to **`dev`**. Do not leave implementation uncommitted on `dev`. Beads files / `vendor/beads` / `.envrc` stay uncommitted. | lou 2026-09-12 |
| What deploys where? | Push **`dev`** → GitHub Actions → **dev.memeon.ai**. Push **`production`** → **memeon.ai**. | README + Strong 2026-07-28 |
| Who merges? | **Anyone may merge green PRs to `dev`.** After merge, smoke-test **dev.memeon.ai** before the next bead. Promote **`dev` → `production`** only via PR that **Strong alone** can approve. | Strong 2026-08-01 |
| Bead run order | **Serial** for PRs to `dev`. (The `ox/ui` parallel-worktree exception ended when the stack merged to `dev` on 2026-09-12.) | Strong 2026-08-01; lou 2026-09-12 |
| Local web UI / agent-browser | Always **`pnpm run dev:web`** (Vite on :5173). View and interact with **agent-browser** (`/Users/lou/.local/bin/agent-browser`). Auth: `agent-browser --state ./localstorage.json open http://localhost:5173`. Do not use `pnpm run dev` as the web command. API is proxied to :3001; if a flow needs `/api`, start `pnpm run dev:api` separately. | lou 2026-09-08; pnpm 2026-09-12 |
| Codex agents / context boundaries | *(local-only)* [`.codex/config.toml`](.codex/config.toml): subagent V2, 10 concurrent subagents, hooks on, inherited services/apps off. Use the 18 domain roles in [docs/CODEX_AGENTS.md](docs/CODEX_AGENTS.md), fresh bounded contexts and shell + `agent-browser`; restart Codex to reload. | Lou 2026-09-08; [docs/CODEX_CONFIG.md](docs/CODEX_CONFIG.md) |
| Beads local handoff | *(local-only)* Use [`scripts/bd`](scripts/bd) and [the local workflow](docs/BEADS_LOCAL_WORKFLOW.md). New implementation uses authored readiness and verified closure; thread/session actors are stable and existing claims remain untouched. | mo-6bv 2026-09-09 |
| Change React UI | Read [web/src/Anatomy.mdx](web/src/Anatomy.mdx) first — its **Making a change** table says which file a copy / style / state / route / token change lands in. Tiers `atoms/ → molecules/ → organisms/ → screens/ → views/` are pure props → markup; copy and state live in `hooks/` + `stores/`; prop-bag builders in `lib/*Model.ts`; tokens in `web/src/index.css` (`@theme static`, register new namespaces in `lib/cn.ts`). Every component has a story. Gate: `pnpm run check` (or `pnpm --filter web run check-tiers` for the structure alone). | lou 2026-09-12 |
| ox/ui overhaul / Soft Press redesign | **Shipped to `dev` 2026-09-12** (stacked PRs #17→#45, then pnpm/Turborepo #46). `ox/ui` is retired; do not restart or branch from it. The Paper design file is the visual authority for design-to-app work; the shipped tokens are `web/src/index.css`. | lou 2026-09-12 |
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

Rows marked *(local-only)* — and every path under `docs/`, `scripts/`, `.beads/`, `.codex/`, `.grok/` — exist on Lou's checkout only (git-excluded). A fresh clone has `README.md`, this file, `web/src/Anatomy.mdx` and the code; those three are kept self-sufficient.

| Path | What |
| --- | --- |
| [docs/ENV_AND_DEPLOY.md](docs/ENV_AND_DEPLOY.md) | Env matrix, CI deploy path, no local deploy |
| [docs/STATIC_ANALYSIS_TRACK.md](docs/STATIC_ANALYSIS_TRACK.md) | Epic mo-100 bead map + workflow FSM |
| [README.md](README.md) | Product layout, auth, environments table |
| `.grok/workflows/memeon-bead-pr.rhai` | Approved bead→PR pipeline (planner ≠ implementer ≠ verifier) |
| `bd show mo-100` | Epic + children for the fix track |
| `bd show mo-9dg` | *(local-only)* ox/ui headless molecularize + XState/MobX + Storybook |
| [web/src/Anatomy.mdx](web/src/Anatomy.mdx) | React UI map: tiers, engines, where state and copy live, how to make a change |
| [docs/OX_UI_HANDOFF.md](docs/OX_UI_HANDOFF.md) | *(local-only)* ox/ui history up to the dev merge |

## How to append

New repo learnings: **one row** in the resolver table + optional deeper page under `docs/`. Never dump narrative into this file.
