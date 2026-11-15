// Storage of git dependencies provided by the client (VS Code: files in `globalStorageUri`),
// accessed with the `likec4/dependency-storage/*` requests (see `DependencyStorageRequests` in `protocol.ts`).
// Stub of the contracts package: it is filled by the VS Code storage package.
// Browser-safe: uses only the LSP connection.
import type { Driver } from 'unstorage'
import type { Connection } from 'vscode-languageserver'

/**
 * Creates the unstorage driver backed by the client
 * (wrapped with `createStorage` by `trackClientDependencyStorage`).
 * Used only if the client declares `dependencyStorage: true` in `initializationOptions`.
 *
 * Values passed to and returned by the driver are serialized strings (see `DependencyStorageRequests.Value`).
 *
 * Stub: throws (no client declares the flag yet); the caller keeps the storage of the host.
 */
export function createLspStorageDriver(_connection: Connection): Driver {
  throw new Error('Client dependency storage is not implemented yet')
}
