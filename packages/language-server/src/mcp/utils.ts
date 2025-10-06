import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js'
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
  ToolAnnotations,
} from '@modelcontextprotocol/sdk/types.js'
import type { z, ZodRawShape, ZodTypeAny } from 'zod/v3'

import { loggable } from '@likec4/log'
import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { LikeC4LanguageServices } from '../LikeC4LanguageServices'
import { logger as mainLogger } from '../logger'

export const logger = mainLogger.getChild('mcp')

type ToolResult<Out extends undefined | ZodRawShape = undefined> =
  // dprint-ignore
  Out extends ZodRawShape
    ? z.objectOutputType<Out, ZodTypeAny>
    : string

type LikeC4ToolCallback<Args extends undefined | ZodRawShape, Out extends undefined | ZodRawShape> =
  // dprint-ignore
  Args extends ZodRawShape
    ? (languageServices: LikeC4LanguageServices, args: z.objectOutputType<Args, ZodTypeAny>, extra: RequestHandlerExtra<ServerRequest, ServerNotification>) => Promise<ToolResult<Out>>
    : (languageServices: LikeC4LanguageServices, extra: RequestHandlerExtra<ServerRequest, ServerNotification>) => Promise<ToolResult<Out>>

export function likec4Tool<
  InputArgs extends ZodRawShape,
  OutputArgs extends ZodRawShape,
  Cb extends LikeC4ToolCallback<InputArgs, OutputArgs>,
>(
  config: {
    name: string
    description?: string
    inputSchema?: InputArgs
    outputSchema?: OutputArgs
    annotations?: ToolAnnotations
  },
  cb: Cb,
): (languageServices: LikeC4LanguageServices) => [string, { inputSchema?: InputArgs }, ToolCallback<InputArgs>] {
  const { name, description, ...rest } = config
  return (languageServices: LikeC4LanguageServices) => [
    name,
    {
      description: description?.trim() ?? '',
      ...rest,
    },
    mkcallTool(name, languageServices, cb),
  ]
}

function mkcallTool<
  InputArgs extends ZodRawShape,
  OutputArgs extends ZodRawShape,
  Cb extends LikeC4ToolCallback<InputArgs, OutputArgs>,
>(
  name: string,
  languageServices: LikeC4LanguageServices,
  cb: Cb,
): ToolCallback<InputArgs> {
  const tool = cb.bind(null, languageServices)
  return (async function callTool(args: any, extra: any): Promise<CallToolResult> {
    logger.debug('Calling tool {name}, args: {args}', { name, args })
    try {
      const result = await tool.call(null, args, extra)
      if (typeof result === 'string') {
        return {
          content: [{
            type: 'text',
            text: result,
          }],
        }
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result),
        }],
        structuredContent: result,
      }
    } catch (err) {
      logger.error(`Tool ${name} failed`, { err })
      return {
        content: [{
          type: 'text',
          text: err instanceof Error ? err.message : loggable(err),
        }],
        isError: true,
      }
    }
  }) as unknown as ToolCallback<InputArgs>
}
