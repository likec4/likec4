// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { ReadBootstrapIcon } from '@likec4/vscode-preview/protocol'
import { describe, expect, it, vi } from 'vitest'
import { createBootstrapIconLoader, isBootstrapIconName } from './bootstrapIcon'

const svg = '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"/>'
const svgBytes = new TextEncoder().encode(svg)
const storageUri = { fsPath: '/global-storage' }
const storageDirPath = '/global-storage/bootstrap-icons'
const storageFilePath = '/global-storage/bootstrap-icons/boxes.svg'

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
    const load = createBootstrapIconLoader(fetcher)

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
    const load = createBootstrapIconLoader(storageUri as never, fileSystem, fetcher)

    await expect(load('boxes')).resolves.toEqual({
      base64data: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    })
    expect(fileSystem.readFile).toHaveBeenCalledWith(expect.objectContaining({ fsPath: storageFilePath }))
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
    const load = createBootstrapIconLoader(storageUri as never, fileSystem, fetcher)

    await expect(load('boxes')).resolves.toEqual({
      base64data: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    })
    expect(fileSystem.readFile).toHaveBeenCalledWith(expect.objectContaining({ fsPath: storageFilePath }))
    expect(fileSystem.createDirectory).toHaveBeenCalledWith(expect.objectContaining({ fsPath: storageDirPath }))
    expect(fileSystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ fsPath: storageFilePath }),
      svgBytes,
    )
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
    const load = createBootstrapIconLoader(storageUri as never, fileSystem, fetcher)

    await expect(load('boxes')).resolves.toEqual({
      base64data: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    })
    expect(fileSystem.readFile).toHaveBeenCalledWith(expect.objectContaining({ fsPath: storageFilePath }))
    expect(fileSystem.createDirectory).toHaveBeenCalledWith(expect.objectContaining({ fsPath: storageDirPath }))
    expect(fileSystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ fsPath: storageFilePath }),
      svgBytes,
    )
    expect(fetcher).toHaveBeenCalledWith(
      'https://icons.like-c4.dev/bootstrap/boxes.svg',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('returns null without fetching an invalid name', async () => {
    const fetcher = vi.fn<typeof fetch>()
    await expect(createBootstrapIconLoader(fetcher)('../boxes')).resolves.toEqual({ base64data: null })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('rejects non-SVG and oversized responses', async () => {
    const nonSvg = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('x', { headers: { 'content-type': 'image/svg+xmlfoo' } }),
    )
    const oversized = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('x'.repeat(256 * 1024 + 1), { headers: { 'content-type': 'image/svg+xml' } }),
    )

    await expect(createBootstrapIconLoader(nonSvg)('boxes')).resolves.toEqual({ base64data: null })
    await expect(createBootstrapIconLoader(oversized)('boxes')).resolves.toEqual({ base64data: null })
  })

  it('returns null on fetch failure and caches only successful results', async () => {
    const failing = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'))
    const loadFailing = createBootstrapIconLoader(failing)
    await expect(loadFailing('boxes')).resolves.toEqual({ base64data: null })
    await expect(loadFailing('boxes')).resolves.toEqual({ base64data: null })
    expect(failing).toHaveBeenCalledTimes(2)

    const succeeding = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(svg, { headers: { 'content-type': 'image/svg+xml' } }),
    )
    const load = createBootstrapIconLoader(succeeding)
    await load('boxes')
    await load('boxes')
    expect(succeeding).toHaveBeenCalledTimes(1)
  })
})
