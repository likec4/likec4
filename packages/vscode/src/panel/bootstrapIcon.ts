// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import * as vscode from 'vscode'

const bootstrapIconName = /^[a-z0-9][a-z0-9-]{0,127}$/
const maxSvgBytes = 256 * 1024
const bootstrapIconUrl = (name: string) => `https://icons.like-c4.dev/bootstrap/${name}.svg`

export type BootstrapIconResult = { base64data: string | null }

type IconFileSystem = Pick<typeof vscode.workspace.fs, 'readFile' | 'writeFile' | 'createDirectory'>

export const isBootstrapIconName = (name: string) => bootstrapIconName.test(name)

const bootstrapIconCacheUri = (storageUri: vscode.Uri, name: string) =>
  vscode.Uri.joinPath(storageUri, 'bootstrap-icons', `${name}.svg`)

async function readBoundedResponseBody(response: Response): Promise<Uint8Array | null> {
  const reader = response.body?.getReader()
  if (!reader) {
    return null
  }

  const chunks: Uint8Array[] = []
  let totalBytes = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    totalBytes += value.byteLength
    if (totalBytes > maxSvgBytes) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

export function createBootstrapIconLoader(
  storageUri: vscode.Uri,
  fileSystem: IconFileSystem = vscode.workspace.fs,
  fetcher: typeof fetch = fetch,
) {
  return async (name: string): Promise<BootstrapIconResult> => {
    if (!isBootstrapIconName(name)) {
      return { base64data: null }
    }

    const iconUri = bootstrapIconCacheUri(storageUri, name)
    try {
      const bytes = await fileSystem.readFile(iconUri)
      if (bytes.byteLength <= maxSvgBytes) {
        return { base64data: `data:image/svg+xml;base64,${Buffer.from(bytes).toString('base64')}` }
      }
    } catch {
      // Cache misses and storage errors fall through to the CDN.
    }

    try {
      const response = await fetcher(bootstrapIconUrl(name), { signal: AbortSignal.timeout(10_000) })
      const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() ?? ''
      if (!response.ok || contentType !== 'image/svg+xml') {
        return { base64data: null }
      }
      const bytes = await readBoundedResponseBody(response)
      if (!bytes) {
        return { base64data: null }
      }
      const base64data = `data:image/svg+xml;base64,${Buffer.from(bytes).toString('base64')}`
      try {
        await fileSystem.createDirectory(vscode.Uri.joinPath(storageUri, 'bootstrap-icons'))
        await fileSystem.writeFile(iconUri, bytes)
      } catch {
        // The icon remains usable when storage is unavailable.
      }
      return { base64data }
    } catch {
      return { base64data: null }
    }
  }
}
