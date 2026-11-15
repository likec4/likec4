// Storage of git dependencies provided by the client (VS Code: files in `globalStorageUri`),
// accessed with the `likec4/dependency-storage/*` requests (see `DependencyStorageRequests` in `protocol.ts`).
// Browser-safe: uses only the LSP connection.
import type { Driver } from 'unstorage'
import type { Connection } from 'vscode-languageserver'
import { DependencyStorageRequests } from '../protocol'

/**
 * Subset of the LSP connection used by the driver
 */
export type LspStorageConnection = Pick<Connection, 'sendRequest'>

/**
 * Creates the unstorage driver backed by the client
 * (wrapped with `createStorage` by `trackClientDependencyStorage`).
 * Used only if the client declares `dependencyStorage: true` in `initializationOptions`.
 *
 * Values passed to and returned by the driver are serialized strings (see `DependencyStorageRequests.Value`).
 *
 * Supported: `getItem`, `getItems`, `hasItem` (a `get-item` request, `value !== null`), `setItem`, `getKeys`.
 * Not supported (the protocol has no requests for them, the dependency storage never removes records):
 * `removeItem` and `clear` throw; raw values and metadata are not provided.
 */
export function createLspStorageDriver(connection: LspStorageConnection): Driver {
  const getItem = async (key: string): Promise<string | null> => {
    const res = await connection.sendRequest(DependencyStorageRequests.GetItem.req, { key })
    return typeof res?.value === 'string' ? res.value : null
  }
  const unsupported = (method: string) => new Error(`Client dependency storage does not support ${method}`)

  return {
    name: 'likec4-lsp-client',
    getItem: key => getItem(key),
    hasItem: async key => (await getItem(key)) !== null,
    getItems: async items => {
      if (items.length === 0) {
        return []
      }
      const keys = items.map(item => item.key)
      const res = await connection.sendRequest(DependencyStorageRequests.GetItems.req, { keys })
      const values = new Map<string, string>()
      for (const item of res?.items ?? []) {
        if (typeof item.value === 'string') {
          values.set(item.key, item.value)
        }
      }
      // Keys omitted by the client are returned with `null`, in the order of the request
      return keys.map(key => ({ key, value: values.get(key) ?? null }))
    },
    setItem: async (key, value) => {
      await connection.sendRequest(DependencyStorageRequests.SetItem.req, { key, value })
    },
    getKeys: async base => {
      const res = await connection.sendRequest(DependencyStorageRequests.GetKeys.req, base ? { base } : {})
      return res?.keys ?? []
    },
    removeItem: () => {
      throw unsupported('removeItem')
    },
    clear: () => {
      throw unsupported('clear')
    },
  }
}
