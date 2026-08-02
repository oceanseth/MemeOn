import type { Tier as SharedTier } from '../../../shared/tiers'
import type { Tier as UiTier } from '@memeon/ui'

/**
 * `shared/tiers.ts` is owned by the api and `@memeon/ui` must not depend on app
 * code, so `Tier` is declared in both places. These assertions fail the
 * typecheck the moment the two shapes drift, instead of at runtime.
 */
const _sharedIsUi: UiTier = null as unknown as SharedTier
const _uiIsShared: SharedTier = null as unknown as UiTier
void _sharedIsUi
void _uiIsShared
