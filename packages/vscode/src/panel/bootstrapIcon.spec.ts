// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { ReadBootstrapIcon } from '@likec4/vscode-preview/protocol'
import { describe, expect, it, vi } from 'vitest'
import { createBootstrapIconLoader, isBootstrapIconName } from './bootstrapIcon'

vi.mock('vscode', () => {
  const parse = (value: string) => {
    const parsed = new URL(value)
    const fsPath = decodeURIComponent(parsed.pathname)
    return {
      scheme: parsed.protocol.slice(0, -1),
      authority: parsed.host,
      path: parsed.pathname,
      fsPath,
      toString: () => value,
    }
  }

  const joinPath = (base: { toString: () => string }, ...segments: string[]) => {
    const uri = new URL(base.toString())
    const nextPath = [uri.pathname.replace(/\/+$/, ''), ...segments.map(segment => segment.replace(/^\/+/, ''))]
      .filter(Boolean)
      .join('/')
    uri.pathname = nextPath.startsWith('/') ? nextPath : `/${nextPath}`
    return parse(uri.toString())
  }

  return { Uri: { parse, joinPath } }
})

import * as vscode from 'vscode'

const svg = '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"/>'
const svgBytes = new TextEncoder().encode(svg)
const storageUri = vscode.Uri.parse('file:///global-storage')
const storageDirUri = vscode.Uri.joinPath(storageUri, 'bootstrap-icons')
const storageFileUri = vscode.Uri.joinPath(storageDirUri, 'boxes.svg')
const missingFileSystem = () => ({
  readFile: vi.fn().mockRejectedValue(new Error('FileNotFound')),
  writeFile: vi.fn().mockResolvedValue(undefined),
  createDirectory: vi.fn().mockResolvedValue(undefined),
})
const expectUri = (actual: { toString(): string } | undefined, expected: { toString(): string }) => {
  expect(actual?.toString()).toBe(expected.toString())
}

describe('bootstrap icon loader', () => {
  it('defines a dedicated Bootstrap-icon request', () => {
    expect(ReadBootstrapIcon.method).toBe('read-bootstrap-icon')
  })

  it('accepts only bounded Bootstrap icon names', () => {
    expect(isBootstrapIconName('boxes')).toBe(true)
    expect(isBootstrapIconName('buildings-fill')).toBe(true)
    expect(isBootstrapIconName('../secret')).toBe(false)
    expect(isBootstrapIconName('boxes.svg')).toBe(false)
    expect(isBootstrapIconName('A')).toBe(false)
  })

  it('returns a data URL from the fixed Bootstrap CDN endpoint', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(svg, { headers: { 'content-type': 'image/svg+xml; charset=utf-8' } }),
    )
    const load = createBootstrapIconLoader(storageUri, missingFileSystem(), fetcher)

    await expect(load('boxes')).resolves.toEqual({
      base64data: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    })
    expect(fetcher).toHaveBeenCalledWith(
      'https://icons.like-c4.dev/bootstrap/boxes.svg',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('reads a valid icon from global storage before it fetches', async () => {
    const fileSystem = {
      readFile: vi.fn().mockResolvedValue(svgBytes),
      writeFile: vi.fn(),
      createDirectory: vi.fn(),
    }
    const fetcher = vi.fn<typeof fetch>()
    const load = createBootstrapIconLoader(storageUri, fileSystem, fetcher)

    await expect(load('boxes')).resolves.toEqual({
      base64data: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    })
    expect(storageUri.toString()).toBe('file:///global-storage')
    expect(storageUri.fsPath).toBe('/global-storage')
    expect(storageDirUri.toString()).toBe('file:///global-storage/bootstrap-icons')
    expect(storageFileUri.toString()).toBe('file:///global-storage/bootstrap-icons/boxes.svg')
    expect(fileSystem.readFile).toHaveBeenCalledOnce()
    expectUri(fileSystem.readFile.mock.calls[0]?.[0], storageFileUri)
    expect(fileSystem.createDirectory).not.toHaveBeenCalled()
    expect(fileSystem.writeFile).not.toHaveBeenCalled()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('fetches and caches a missing icon in global storage', async () => {
    const fileSystem = {
      readFile: vi.fn().mockRejectedValue(new Error('FileNotFound')),
      createDirectory: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
    }
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(svg, { headers: { 'content-type': 'image/svg+xml' } }),
    )
    const load = createBootstrapIconLoader(storageUri, fileSystem, fetcher)

    await expect(load('boxes')).resolves.toEqual({
      base64data: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    })
    expect(fileSystem.readFile).toHaveBeenCalledOnce()
    expectUri(fileSystem.readFile.mock.calls[0]?.[0], storageFileUri)
    expect(fileSystem.createDirectory).toHaveBeenCalledOnce()
    expectUri(fileSystem.createDirectory.mock.calls[0]?.[0], storageDirUri)
    expect(fileSystem.writeFile).toHaveBeenCalledOnce()
    expectUri(fileSystem.writeFile.mock.calls[0]?.[0], storageFileUri)
    expect(fileSystem.writeFile.mock.calls[0]?.[1]).toEqual(svgBytes)
    expect(fetcher).toHaveBeenCalledWith(
      'https://icons.like-c4.dev/bootstrap/boxes.svg',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('still returns fetched data if caching to global storage fails', async () => {
    const fileSystem = {
      readFile: vi.fn().mockRejectedValue(new Error('FileNotFound')),
      createDirectory: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockRejectedValue(new Error('disk full')),
    }
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(svg, { headers: { 'content-type': 'image/svg+xml' } }),
    )
    const load = createBootstrapIconLoader(storageUri, fileSystem, fetcher)

    await expect(load('boxes')).resolves.toEqual({
      base64data: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    })
    expect(fileSystem.readFile).toHaveBeenCalledOnce()
    expectUri(fileSystem.readFile.mock.calls[0]?.[0], storageFileUri)
    expect(fileSystem.createDirectory).toHaveBeenCalledOnce()
    expectUri(fileSystem.createDirectory.mock.calls[0]?.[0], storageDirUri)
    expect(fileSystem.writeFile).toHaveBeenCalledOnce()
    expectUri(fileSystem.writeFile.mock.calls[0]?.[0], storageFileUri)
    expect(fileSystem.writeFile.mock.calls[0]?.[1]).toEqual(svgBytes)
    expect(fetcher).toHaveBeenCalledWith(
      'https://icons.like-c4.dev/bootstrap/boxes.svg',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('skips stale oversized storage data and refreshes from the CDN', async () => {
    const fileSystem = {
      readFile: vi.fn().mockResolvedValue(new Uint8Array(256 * 1024 + 1)),
      createDirectory: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
    }
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(svg, { headers: { 'content-type': 'image/svg+xml' } }),
    )
    const load = createBootstrapIconLoader(storageUri, fileSystem, fetcher)

    await expect(load('boxes')).resolves.toEqual({
      base64data: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    })
    expect(fileSystem.readFile).toHaveBeenCalledOnce()
    expectUri(fileSystem.readFile.mock.calls[0]?.[0], storageFileUri)
    expect(fileSystem.createDirectory).toHaveBeenCalledOnce()
    expectUri(fileSystem.createDirectory.mock.calls[0]?.[0], storageDirUri)
    expect(fileSystem.writeFile).toHaveBeenCalledOnce()
    expectUri(fileSystem.writeFile.mock.calls[0]?.[0], storageFileUri)
    expect(fileSystem.writeFile.mock.calls[0]?.[1]).toEqual(svgBytes)
    expect(fetcher).toHaveBeenCalledWith(
      'https://icons.like-c4.dev/bootstrap/boxes.svg',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('returns null without fetching an invalid name', async () => {
    const fetcher = vi.fn<typeof fetch>()
    await expect(createBootstrapIconLoader(storageUri, missingFileSystem(), fetcher)('../boxes')).resolves.toEqual({
      base64data: null,
    })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('rejects non-SVG and oversized responses', async () => {
    const nonSvg = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('x', { headers: { 'content-type': 'image/svg+xmlfoo' } }),
    )
    const oversized = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('x'.repeat(256 * 1024 + 1), { headers: { 'content-type': 'image/svg+xml' } }),
    )

    await expect(createBootstrapIconLoader(storageUri, missingFileSystem(), nonSvg)('boxes')).resolves.toEqual({
      base64data: null,
    })
    await expect(createBootstrapIconLoader(storageUri, missingFileSystem(), oversized)('boxes')).resolves.toEqual({
      base64data: null,
    })
  })

  it('returns null on fetch failure and does not cache successful results in process', async () => {
    const failing = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'))
    const loadFailing = createBootstrapIconLoader(storageUri, missingFileSystem(), failing)
    await expect(loadFailing('boxes')).resolves.toEqual({ base64data: null })
    await expect(loadFailing('boxes')).resolves.toEqual({ base64data: null })
    expect(failing).toHaveBeenCalledTimes(2)

    const succeeding = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(svg, { headers: { 'content-type': 'image/svg+xml' } }),
    )
    const load = createBootstrapIconLoader(storageUri, missingFileSystem(), succeeding)
    await load('boxes')
    await load('boxes')
    expect(succeeding).toHaveBeenCalledTimes(2)
  })
})
