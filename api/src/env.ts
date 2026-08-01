/** Runtime configuration. All values have prod defaults; dev/local override via env. */
export const env = {
  tableName: process.env.TABLE_NAME ?? 'memeon-production',
  ssmPrefix: process.env.SSM_PREFIX ?? '/memeon/production',
  assetsBucket: process.env.ASSETS_BUCKET ?? 'memeon-assets-production',
  /** S3 Vectors bucket holding the semantic search index (index name: "memes"). */
  vectorBucket: process.env.VECTOR_BUCKET ?? 'memeon-vectors-production',
  /** Public https base for objects in the assets bucket (og images, tier frames). */
  assetsBase:
    process.env.ASSETS_BASE ??
    `https://${process.env.ASSETS_BUCKET ?? 'memeon-assets-production'}.s3.us-west-2.amazonaws.com`,
  /** Canonical site origin, used in og pages and share URLs. */
  siteOrigin: process.env.SITE_ORIGIN ?? 'https://memeon.ai',
  /**
   * Comma-separated MemeOn user `sub`s allowed to hit admin routes (e.g. frame regen).
   * Empty = nobody (fail-closed). Set on Lambda via console/SSM; not required for deploys.
   */
  adminSubs: (process.env.ADMIN_SUBS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}

/** True if `sub` is listed in `ADMIN_SUBS` (fail-closed when unset). */
export function isAdminSub(sub: string): boolean {
  return env.adminSubs.length > 0 && env.adminSubs.includes(sub)
}
