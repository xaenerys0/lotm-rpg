export const SESSION_KEY_PREFIX = "lotm-rpg-session-";
export const SESSION_INDEX_KEY = "lotm-rpg-session-index";
/** Which character every page shows — the single active-character pointer. */
export const ACTIVE_SESSION_KEY = "lotm-rpg-active-session";
export const PROVIDER_CONFIG_KEY = "lotm-rpg-provider-config";
/** Independent image-provider config for scene art (image model selection). */
export const IMAGE_PROVIDER_CONFIG_KEY = "lotm-rpg-image-provider-config";
export const PROLOGUE_DRAFT_KEY = "lotm-rpg-prologue-draft";
export const MODELS_CACHE_KEY = "lotm-rpg-models-cache";
export const PREFERENCES_KEY = "lotm-rpg-preferences";
export const JOURNAL_KEY_PREFIX = "lotm-rpg-journal-";
export const LEGACIES_KEY = "lotm-rpg-legacies";
export const ECHOES_KEY = "lotm-rpg-echoes";
/** Per-screen one-shot hint dismissal flags (`lotm-rpg-hint-<id>` = "1"). */
export const HINT_KEY_PREFIX = "lotm-rpg-hint-";
/**
 * Cross-device sync ledger: the save ids and world-memory keys this device has
 * seen in the cloud. Lets reconcile tell a brand-new local-only record (push it)
 * from one deleted on another device (drop it) — see components/game/cloud-sync.
 */
export const CLOUD_SYNCED_KEY = "lotm-rpg-cloud-synced";
// Per-session transient keys (separate namespace from the session save itself).
export const COMBAT_KEY_PREFIX = "lotm:combat:";
export const USAGE_KEY_PREFIX = "lotm:usage:";
