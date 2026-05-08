import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js'
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
  ToolAnnotations,
} from '@modelcontextprotocol/sdk/types.js'
import type { z, ZodRawShape, ZodTypeAny } from 'zod/v3'

import { hasProp } from '@likec4/core'
import type { LikeC4LanguageServices } from '@likec4/language-server'
import { loggable, logger as mainLogger } from '@likec4/log'
import type { McpServer, ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { isEmptyish } from 'remeda'
import type { IsUnknown } from 'type-fest'
import { useLanguageServices } from './ctx'

export const logger = mainLogger.getChild('mcp')

export type MCPRegistrationFunction = (mcpServer: McpServer) => McpServer

type inferArg<Args = unknown, Default = undefined> =
  // dprint-ignore
  Args extends ZodRawShape
    ? z.objectOutputType<Args, ZodTypeAny>
    : IsUnknown<Args> extends true
      ? unknown
      : Default

type LikeC4ToolCallbackWithoutArgs = (
  tool: (
    languageServices: LikeC4LanguageServices,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
  ) => Promise<string>,
) => MCPRegistrationFunction
type LikeC4ToolCallbackWithArgs<Args extends ZodRawShape> = (
  tool: (
    languageServices: LikeC4LanguageServices,
    args: inferArg<Args>,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
  ) => Promise<string>,
) => MCPRegistrationFunction
type LikeC4ToolCallbackWithInOut<Args extends ZodRawShape, Out extends ZodRawShape> = (
  tool: (
    languageServices: LikeC4LanguageServices,
    args: inferArg<Args>,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
  ) => Promise<inferArg<Out, string>>,
) => MCPRegistrationFunction

export function likec4Tool(
  config: {
    name: string
    description?: string
    inputSchema?: never
    outputSchema?: never
    annotations?: ToolAnnotations
  },
): LikeC4ToolCallbackWithoutArgs
export function likec4Tool<InputArgs extends ZodRawShape>(
  config: {
    name: string
    description?: string
    inputSchema: InputArgs
    outputSchema?: never
    annotations?: ToolAnnotations
  },
): LikeC4ToolCallbackWithArgs<InputArgs>
export function likec4Tool<InputArgs extends ZodRawShape, OutputArgs extends ZodRawShape>(
  config: {
    name: string
    description?: string
    inputSchema: InputArgs
    outputSchema: OutputArgs
    annotations?: ToolAnnotations
  },
): LikeC4ToolCallbackWithInOut<InputArgs, OutputArgs>
export function likec4Tool(
  config: {
    name: string
    description?: string
    inputSchema?: ZodRawShape
    outputSchema?: ZodRawShape
    annotations?: ToolAnnotations
  },
) {
  return (tool: Function) => (mcpServer: McpServer) => {
    const { name, description, ...rest } = config
    const toolConfig = {
      description: description?.trim() ?? '',
      ...rest,
    }
    mcpServer.registerTool(
      name,
      toolConfig,
      async (...args: any[]): Promise<CallToolResult> => {
        const languageServices = useLanguageServices()
        logger.debug('Calling tool {name}, args: {args}', { name, args })
        try {
          const result = await tool.apply(null, [languageServices, ...args])
          if (typeof result === 'string') {
            return {
              content: [{
                type: 'text',
                text: result,
              }],
            }
          }
          if (!isEmptyish(toolConfig.outputSchema)) {
            return {
              content: [],
              structuredContent: result,
            }
          }
          if (hasProp(result, 'content')) {
            return result as CallToolResult
          }
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result),
            }],
          }
        } catch (err) {
          logger.error(`Tool ${name} failed`, { err })
          return {
            content: [{
              type: 'text',
              text: loggable(err),
            }],
            isError: true,
          }
        }
      },
    )
    return mcpServer
  }
}
