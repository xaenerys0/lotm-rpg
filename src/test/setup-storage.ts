// Node 26 ships a built-in global `localStorage`/`sessionStorage` that is
// `undefined` unless `--localstorage-file` is passed. Because vitest's jsdom
// environment makes `window === globalThis`, that undefined global shadows
// jsdom's own `window.localStorage`, so tests using the bare `localStorage`
// global get `undefined`. Install a Web Storage-compatible polyfill so tests
// (and the components they render) have working storage.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

function installStorage(name: "localStorage" | "sessionStorage"): void {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value: new MemoryStorage(),
  });
}

installStorage("localStorage");
installStorage("sessionStorage");
