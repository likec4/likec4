// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { Readable } from 'node:stream'
import type { MinimalPluginContextWithoutEnvironment } from 'vite'
import type { SharedVirtualModuleOptions } from '../virtuals/_shared'
import {
  createLikeC4AIResponse,
  LIKEC4_AI_ENDPOINT_PATH,
  LikeC4AIRequestBodyTooLargeError,
  LikeC4AIRequestBodyValidationError,
  readLikeC4AIRequestBody,
} from './server'

export type AIServerParams = SharedVirtualModuleOptions & {
  server: import('vite').ViteDevServer
}

export function enableAIServer(
  this: MinimalPluginContextWithoutEnvironment,
  params: AIServerParams,
) {
  const { ai, server, logger } = params

  server.middlewares.use(LIKEC4_AI_ENDPOINT_PATH, async (req, res, next) => {
    if (req.method !== 'POST') {
      next()
      return
    }
    try {
      const body = await readLikeC4AIRequestBody(req)
      const response = createLikeC4AIResponse({ ai, body })
      response.headers.forEach((value, key) => {
        res.setHeader(key, value)
      })
      res.writeHead(response.status, response.statusText)

      if (!response.body) {
        res.end()
        return
      }

      Readable.fromWeb(response.body)
        .on('error', (err) => {
          logger.error('AI stream error', { error: err })
          if (!res.writableEnded) res.end()
        })
        .pipe(res, {
          end: true,
        })
    } catch (err) {
      logger.error('AI request failed', { error: err })
      if (!res.headersSent) {
        const status = err instanceof LikeC4AIRequestBodyTooLargeError
          ? err.statusCode
          : err instanceof LikeC4AIRequestBodyValidationError
          ? err.statusCode
          : err instanceof SyntaxError
          ? 400
          : 500
        const message = err instanceof LikeC4AIRequestBodyTooLargeError
          ? err.message
          : err instanceof LikeC4AIRequestBodyValidationError
          ? err.message
          : err instanceof SyntaxError
          ? 'invalid JSON body'
          : 'AI request failed'
        res.writeHead(status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: message }))
      } else {
        res.end()
      }
    }
  })
}
