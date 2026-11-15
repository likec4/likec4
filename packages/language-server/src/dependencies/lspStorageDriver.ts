// Storage of git dependencies provided by the client (VS Code: files in `globalStorageUri`),
// accessed with the `likec4/dependency-storage/*` requests (see `DependencyStorageRequests` in `protocol.ts`).
// Stub of the contracts package: it is filled by the VS Code storage package.
// Browser-safe: uses only the LSP connection.
import type { Storage } from 'unstorage'
import type { Connection } from 'vscode-languageserver'

/**
 * Creates the dependency storage backed by the client.
 * Used only if the client declares `dependencyStorage: true` in `initializationOptions`.
 *
 * Stub: throws (no client declares the flag yet); the caller keeps the storage of the host.
 */
export function createLspStorageDriver(_connection: Connection): Storage {
  throw new Error('Client dependency storage is not implemented yet')
}
