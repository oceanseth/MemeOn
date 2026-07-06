/** Runtime configuration. All values have prod defaults; dev/local override via env. */
export const env = {
  tableName: process.env.TABLE_NAME ?? 'memeon-production',
  ssmPrefix: process.env.SSM_PREFIX ?? '/memeon/production',
  assetsBucket: process.env.ASSETS_BUCKET ?? 'memeon-assets-production',
  /** Public https base for objects in the assets bucket (og images, tier frames). */
  assetsBase:
    process.env.ASSETS_BASE ??
    `https://${process.env.ASSETS_BUCKET ?? 'memeon-assets-production'}.s3.us-west-2.amazonaws.com`,
  /** Canonical site origin, used in og pages and share URLs. */
  siteOrigin: process.env.SITE_ORIGIN ?? 'https://memeon.ai',
}
