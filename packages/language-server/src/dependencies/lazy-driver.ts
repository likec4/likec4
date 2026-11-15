import type { Driver } from 'unstorage'

/**
 * unstorage driver that creates the actual driver on first access.
 * Nothing is computed or touched (cache directory, file system) until the storage is used,
 * so a workspace without git dependencies never reaches the backing driver.
 */
export function lazyDriver(name: string, create: () => Driver): Driver {
  let instance: Driver | undefined
  const driver = (): Driver => (instance ??= create())
  return {
    name: `lazy:${name}`,
    hasItem: (key, opts) => driver().hasItem(key, opts),
    getItem: (key, opts) => driver().getItem(key, opts),
    setItem: async (key, value, opts) => {
      const target = driver()
      if (!target.setItem) {
        throw new Error(`Storage driver ${target.name ?? name} is read-only`)
      }
      await target.setItem(key, value, opts)
    },
    removeItem: async (key, opts) => {
      await driver().removeItem?.(key, opts)
    },
    getKeys: (base, opts) => driver().getKeys(base, opts),
    clear: async (base, opts) => {
      await driver().clear?.(base, opts)
    },
    dispose: async () => {
      // Not created: nothing to dispose
      await instance?.dispose?.()
    },
  }
}
