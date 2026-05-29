/**
 * A no-op `subscribe` for `useSyncExternalStore`.
 *
 * Use it when the external value is read once on the client and never changes
 * during the component's lifetime — SSR-safe `localStorage` or `matchMedia`
 * snapshots, for example. Pass `noopSubscribe` as the `subscribe` argument so
 * React never re-subscribes, and supply the real value via `getSnapshot` (with
 * a server fallback via `getServerSnapshot`).
 */
export const noopSubscribe = () => () => {};
