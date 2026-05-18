// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { loggable } from '@likec4/log'
import { detectAI } from '@likec4/vite-plugin/ai/detect'
import {
  createLikeC4AIResponse,
  DEFAULT_LIKEC4_AI_REQUEST_MAX_BYTES,
  LIKEC4_AI_ENDPOINT_PATH,
  LikeC4AIRequestBodyTooLargeError,
  LikeC4AIRequestBodyValidationError,
  readLikeC4AIRequestBody,
} from '@likec4/vite-plugin/ai/server'
import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'

const DEFAULT_PORT = 33336

type HandlerParams = {
  listen?: string | undefined
  port?: number | undefined
  corsOrigin?: string | undefined
  maxBodySize?: number | undefined
}

type AIOptions = NonNullable<Awaited<ReturnType<typeof detectAI>>>

type AIProxyRequestHandlerParams = HandlerParams & {
  ai: AIOptions
}

type ValidateAIProxyOptionsParams = Pick<HandlerParams, 'corsOrigin' | 'listen' | 'maxBodySize'>

function splitCorsOrigins(corsOrigin: string | undefined): Array<string> {
  return corsOrigin?.split(',').map(value => value.trim()).filter(Boolean) ?? []
}

export function isLocalListenAddress(listen: string | undefined): boolean {
  const host = (listen ?? 'localhost').trim().toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

export function allowedCorsOrigin(
  req: Pick<IncomingMessage, 'headers'>,
  corsOrigin: string | undefined,
): string | undefined {
  const allowed = splitCorsOrigins(corsOrigin)
  if (allowed.length === 0) {
    return undefined
  }
  const origin = req.headers.origin
  if (!origin) {
    return allowed.includes('*') ? '*' : undefined
  }
  if (allowed.includes('*')) {
    return '*'
  }
  return allowed.includes(origin) ? origin : undefined
}

export function validateAIProxyOptions({
  listen,
  corsOrigin,
  maxBodySize = DEFAULT_LIKEC4_AI_REQUEST_MAX_BYTES,
}: ValidateAIProxyOptionsParams): void {
  if (!Number.isFinite(maxBodySize) || maxBodySize <= 0) {
    throw new Error('--max-body-size must be a positive number of bytes')
  }
  if (!isLocalListenAddress(listen) && splitCorsOrigins(corsOrigin).includes('*')) {
    throw new Error('Refusing --cors-origin "*" while listening on a public interface')
  }
}

function setCorsHeaders(req: IncomingMessage, res: ServerResponse, corsOrigin: string | undefined) {
  const allowedOrigin = allowedCorsOrigin(req, corsOrigin)
  if (!allowedOrigin) {
    return
  }
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  if (allowedOrigin !== '*') {
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function writeJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  options: {
    headers?: Record<string, string>
    headOnly?: boolean
  } = {},
) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...options.headers,
  })
  res.end(options.headOnly ? undefined : JSON.stringify(body))
}

function writeAIProxyError(res: ServerResponse, error: unknown) {
  if (error instanceof LikeC4AIRequestBodyTooLargeError) {
    writeJson(res, error.statusCode, { error: error.message })
    return
  }
  if (error instanceof LikeC4AIRequestBodyValidationError) {
    writeJson(res, error.statusCode, { error: error.message })
    return
  }
  if (error instanceof SyntaxError) {
    writeJson(res, 400, { error: 'invalid JSON body' })
    return
  }
  writeJson(res, 500, { error: 'AI proxy request failed' })
}

export function createAIProxyRequestHandler({
  ai,
  listen = 'localhost',
  port = DEFAULT_PORT,
  corsOrigin,
  maxBodySize = DEFAULT_LIKEC4_AI_REQUEST_MAX_BYTES,
}: AIProxyRequestHandlerParams) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    setCorsHeaders(req, res, corsOrigin)

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? `${listen}:${port}`}`)
    if (url.pathname === '/health') {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        writeJson(res, 405, { error: 'method not allowed' }, { headers: { Allow: 'GET, HEAD' } })
        return
      }
      writeJson(res, 200, {
        ok: true,
        adapter: ai.adapter.name,
      }, { headOnly: req.method === 'HEAD' })
      return
    }

    if (url.pathname !== LIKEC4_AI_ENDPOINT_PATH) {
      writeJson(res, 404, { error: 'not found' })
      return
    }

    if (req.method !== 'POST') {
      writeJson(res, 405, { error: 'method not allowed' }, { headers: { Allow: 'POST, OPTIONS' } })
      return
    }

    try {
      const body = await readLikeC4AIRequestBody(req, {
        maxBytes: maxBodySize,
      })
      const response = createLikeC4AIResponse({ ai, body })
      response.headers.forEach((value, key) => {
        res.setHeader(key, value)
      })
      // Apply CORS headers after provider response headers so they cannot be overwritten.
      setCorsHeaders(req, res, corsOrigin)
      res.writeHead(response.status, response.statusText)

      if (!response.body) {
        res.end()
        return
      }

      Readable.fromWeb(response.body as import('node:stream/web').ReadableStream<Uint8Array>)
        .on('error', (error) => {
          console.error(loggable(error))
          if (!res.writableEnded) res.end()
        })
        .pipe(res, {
          end: true,
        })
    } catch (error) {
      console.error(loggable(error))
      if (!res.headersSent) {
        writeAIProxyError(res, error)
      } else {
        res.end()
      }
    }
  }
}

async function handler({
  listen = 'localhost',
  port = DEFAULT_PORT,
  corsOrigin,
  maxBodySize = DEFAULT_LIKEC4_AI_REQUEST_MAX_BYTES,
}: HandlerParams) {
  validateAIProxyOptions({ listen, corsOrigin, maxBodySize })

  const ai = await detectAI()
  if (!ai) {
    throw new Error(
      [
        'AI provider is not configured.',
        'Set OPENAI_API_KEY and optionally OPENAI_CHAT_MODEL or OPENAI_BASE_URL,',
        'or configure another supported provider.',
      ].join(' '),
    )
  }

  const server = createServer(createAIProxyRequestHandler({
    ai,
    listen,
    port,
    corsOrigin,
    maxBodySize,
  }))

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, listen, () => {
      server.off('error', reject)
      resolve()
    })
  })

  const displayHost = listen === '0.0.0.0' ? 'localhost' : listen
  console.info(
    `${k.cyan('LikeC4 AI proxy')} ${k.green(`http://${displayHost}:${port}${LIKEC4_AI_ENDPOINT_PATH}`)}`,
  )
  console.info(`${k.dim('adapter')} ${k.green(ai.adapter.name)}`)
}

const aiProxyCmd = (yargs: yargs.Argv) => {
  return yargs.command({
    command: 'ai-proxy',
    describe: 'Start a LikeC4 AI proxy for static websites',
    builder: yargs =>
      yargs
        .option('listen', {
          alias: 'l',
          string: true,
          desc: 'ip address of the network interface to listen on',
          default: 'localhost',
          nargs: 1,
        })
        .option('port', {
          number: true,
          desc: `port number for the AI proxy (default is ${DEFAULT_PORT})`,
          default: DEFAULT_PORT,
          nargs: 1,
        })
        .option('cors-origin', {
          string: true,
          desc: 'allowed browser origin for static pages, comma-separated; omit for same-origin deployments',
          nargs: 1,
        })
        .option('max-body-size', {
          number: true,
          desc: `maximum request body size in bytes (default is ${DEFAULT_LIKEC4_AI_REQUEST_MAX_BYTES})`,
          default: DEFAULT_LIKEC4_AI_REQUEST_MAX_BYTES,
          nargs: 1,
        }),
    handler: async args => {
      await handler({
        listen: args.listen,
        port: args.port,
        corsOrigin: args['cors-origin'],
        maxBodySize: args['max-body-size'],
      })
    },
  })
}

export default aiProxyCmd
