// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { LIKEC4_AI_ENDPOINT_PATH } from '@likec4/vite-plugin/ai/server'
import type { IncomingMessage } from 'node:http'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { describe, expect, it } from 'vitest'
import {
  allowedCorsOrigin,
  createAIProxyRequestHandler,
  isLocalListenAddress,
  validateAIProxyOptions,
} from './index'

function request(origin?: string): Pick<IncomingMessage, 'headers'> {
  return {
    headers: {
      ...(origin && { origin }),
    },
  }
}

const fakeAI = {
  adapter: {
    name: 'test-adapter',
  },
} as Parameters<typeof createAIProxyRequestHandler>[0]['ai']

async function withProxyServer(
  callback: (baseUrl: string) => Promise<void>,
  options: {
    corsOrigin?: string
    maxBodySize?: number
  } = {},
) {
  const server = createServer(createAIProxyRequestHandler({
    ai: fakeAI,
    listen: '127.0.0.1',
    port: 0,
    maxBodySize: options.maxBodySize,
    corsOrigin: options.corsOrigin,
  }))
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      resolve()
    })
  })
  const { port } = server.address() as AddressInfo
  try {
    await callback(`http://127.0.0.1:${port}`)
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
    })
  }
}

describe('ai-proxy CORS options', () => {
  it('does not enable cross-origin requests by default', () => {
    expect(allowedCorsOrigin(request('https://site.example'), undefined)).toBeUndefined()
  })

  it('allows only explicitly configured origins', () => {
    expect(
      allowedCorsOrigin(request('https://site.example'), 'https://site.example, https://other.example'),
    ).toBe('https://site.example')
    expect(
      allowedCorsOrigin(request('https://blocked.example'), 'https://site.example, https://other.example'),
    ).toBeUndefined()
  })

  it('rejects wildcard CORS when listening on a public interface', () => {
    expect(() =>
      validateAIProxyOptions({
        listen: '0.0.0.0',
        corsOrigin: '*',
        maxBodySize: 1024,
      })
    ).toThrow('Refusing --cors-origin "*"')
  })

  it('still allows wildcard CORS for local-only development', () => {
    expect(isLocalListenAddress('localhost')).toBe(true)
    expect(() =>
      validateAIProxyOptions({
        listen: 'localhost',
        corsOrigin: '*',
        maxBodySize: 1024,
      })
    ).not.toThrow()
  })
})

describe('ai-proxy request handler', () => {
  it('answers allowed CORS preflight requests', async () => {
    await withProxyServer(async baseUrl => {
      const response = await fetch(`${baseUrl}${LIKEC4_AI_ENDPOINT_PATH}`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://site.example',
        },
      })

      expect(response.status).toBe(204)
      expect(response.headers.get('access-control-allow-origin')).toBe('https://site.example')
      expect(response.headers.get('access-control-allow-methods')).toBe('POST, OPTIONS')
      expect(response.headers.get('access-control-allow-headers')).toBe('Content-Type')
    }, { corsOrigin: 'https://site.example' })
  })

  it('does not advertise CORS methods for blocked origins', async () => {
    await withProxyServer(async baseUrl => {
      const response = await fetch(`${baseUrl}${LIKEC4_AI_ENDPOINT_PATH}`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://blocked.example',
        },
      })

      expect(response.status).toBe(204)
      expect(response.headers.get('access-control-allow-origin')).toBeNull()
      expect(response.headers.get('access-control-allow-methods')).toBeNull()
      expect(response.headers.get('access-control-allow-headers')).toBeNull()
    }, { corsOrigin: 'https://site.example' })
  })

  it('exposes a health endpoint for GET and HEAD only', async () => {
    await withProxyServer(async baseUrl => {
      const getResponse = await fetch(`${baseUrl}/health`)
      expect(getResponse.status).toBe(200)
      await expect(getResponse.json()).resolves.toEqual({
        ok: true,
        adapter: 'test-adapter',
      })

      const headResponse = await fetch(`${baseUrl}/health`, { method: 'HEAD' })
      expect(headResponse.status).toBe(200)
      expect(await headResponse.text()).toBe('')

      const postResponse = await fetch(`${baseUrl}/health`, { method: 'POST' })
      expect(postResponse.status).toBe(405)
      expect(postResponse.headers.get('allow')).toBe('GET, HEAD')
    })
  })

  it('returns route and method errors with stable headers', async () => {
    await withProxyServer(async baseUrl => {
      const notFound = await fetch(`${baseUrl}/missing`)
      expect(notFound.status).toBe(404)
      await expect(notFound.json()).resolves.toEqual({ error: 'not found' })

      const wrongMethod = await fetch(`${baseUrl}${LIKEC4_AI_ENDPOINT_PATH}`)
      expect(wrongMethod.status).toBe(405)
      expect(wrongMethod.headers.get('allow')).toBe('POST, OPTIONS')
    })
  })

  it('rejects oversized request bodies before calling the AI provider', async () => {
    await withProxyServer(async baseUrl => {
      const response = await fetch(`${baseUrl}${LIKEC4_AI_ENDPOINT_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [] }),
      })

      expect(response.status).toBe(413)
      await expect(response.json()).resolves.toEqual({
        error: 'LikeC4 AI request body exceeds 4 bytes',
      })
    }, { maxBodySize: 4 })
  })

  it('rejects invalid AI request body shapes', async () => {
    await withProxyServer(async baseUrl => {
      const response = await fetch(`${baseUrl}${LIKEC4_AI_ENDPOINT_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: {} }),
      })

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({
        error: 'AI request body messages must be an array',
      })
    })
  })
})
