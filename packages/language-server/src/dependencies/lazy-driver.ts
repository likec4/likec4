import type { Driver } from 'unstorage'

/**
 * unstorage driver that creates the actual driver on first access.
 * Nothing is computed or touched (cache directory, file system) until the storage is used,
 * so a workspace without git dependencies never reaches the backing driver.
 *
 * Forwards all driver methods. Gaps:
 * - `flags` (e.g. `maxDepth`) are not known before the driver is created and are not forwarded:
 *   unstorage then filters keys by depth itself;
 * - `getItemRaw`/`setItemRaw` require the backing driver to implement them (throw otherwise);
 *   the dependency storage does not use raw values.
 */
export function lazyDriver(name: string, create: () => Driver): Driver {
  let instance: Driver | undefined
  const driver = (): Driver => (instance ??= create())
  const unsupported = (method: string) =>
    new Error(`Storage driver ${driver().name ?? name} does not support ${method}`)
  return {
    name: `lazy:${name}`,
    hasItem: (key, opts) => driver().hasItem(key, opts),
    getItem: (key, opts) => driver().getItem(key, opts),
    getItems: async (items, opts) => {
      const target = driver()
      if (target.getItems) {
        return await target.getItems(items, opts)
      }
      return await Promise.all(
        items.map(async item => ({ key: item.key, value: await target.getItem(item.key, item.options ?? opts) })),
      )
    },
    getItemRaw: async (key, opts) => {
      const target = driver()
      if (!target.getItemRaw) {
        throw unsupported('getItemRaw')
      }
      return await target.getItemRaw(key, opts)
    },
    setItem: async (key, value, opts) => {
      const target = driver()
      if (!target.setItem) {
        throw unsupported('setItem')
      }
      await target.setItem(key, value, opts)
    },
    setItemRaw: async (key, value, opts) => {
      const target = driver()
      if (!target.setItemRaw) {
        throw unsupported('setItemRaw')
      }
      await target.setItemRaw(key, value, opts)
    },
    removeItem: async (key, opts) => {
      await driver().removeItem?.(key, opts)
    },
    getMeta: async (key, opts) => (await driver().getMeta?.(key, opts)) ?? null,
    getKeys: (base, opts) => driver().getKeys(base, opts),
    clear: async (base, opts) => {
      await driver().clear?.(base, opts)
    },
    dispose: async () => {
      // Not created: nothing to dispose
      await instance?.dispose?.()
    },
    watch: async callback => {
      const unwatch = await driver().watch?.(callback)
      return unwatch ?? (() => {})
    },
  }
}
