import { invariant } from '@likec4/core'
import { chat, convertMessagesToModelMessages, toServerSentEventsResponse } from '@tanstack/ai'
import type { ModelMessage, UIMessage } from '@tanstack/ai'
import { Readable } from 'node:stream'
import type { MinimalPluginContextWithoutEnvironment, ViteDevServer } from 'vite'
import { logger } from '../logger'
import type { AIOptions } from '../plugin'
import type { SharedVirtualModuleOptions } from '../virtuals/_shared'
import { navigateToDef, readUiStateDef, updateUiStateDef } from './tools'

export type AIServerParams = SharedVirtualModuleOptions & {
  ai?: AIOptions | undefined
  server: ViteDevServer
}

type ChatRequestBody = {
  messages: Array<UIMessage | ModelMessage>
  data: Record<string, any>
}

async function readJsonBody(req: ReadableStream): Promise<ChatRequestBody> {
  const chunks = [] as string[]
  logger.info('Reading request')
  for await (const chunk of req) {
    const str = Buffer.from(chunk).toString()
    process.stdout.write(str)
    chunks.push(str)
  }
  return JSON.parse(chunks.join(''))
}

export function enableAIServer(
  this: MinimalPluginContextWithoutEnvironment,
  params: AIServerParams,
) {
  const { ai, server, logger } = params
  invariant(ai, 'AI is not configured')

  server.middlewares.use('/__likec4_ai', async (req, res, next) => {
    if (req.method !== 'POST') {
      next()
      return
    }
    try {
      const body = await readJsonBody(Readable.toWeb(req))
      const messages = convertMessagesToModelMessages(body.messages ?? [])

      const stream = chat({
        ...ai,
        messages,
        debug: true,
        conversationId: body.data['conversationId'],
        systemPrompts: [
          'You are a helpful assistant that can answer questions about LikeC4 model and update UI.',
        ],
        tools: [
          navigateToDef,
          updateUiStateDef,
          readUiStateDef,
        ],
      })

      const response = toServerSentEventsResponse(stream)
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
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
      } else {
        res.end()
      }
    }
  })
}
