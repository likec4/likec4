import type { ProjectId } from '@likec4/core'
import type { LikeC4LanguageServices } from '@likec4/language-server'
import { enhanceLayoutWithAI } from '@likec4/layouts/ai'
import { completable } from '@modelcontextprotocol/sdk/server/completable'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { prop } from 'remeda'
import * as z from 'zod/v3'
import { useLanguageServices } from '../ctx'
import { toolError } from './_common'

export function applySemanticLayoutTool(
  mcpServer: McpServer,
): McpServer {
  const languageServices = useLanguageServices()
  mcpServer.registerTool(
    'apply-semantic-layout',
    {
      description: 'Apply semantic layout to the likec4 view',
      inputSchema: {
        projectId: completable(
          z.string()
            .default('default' as ProjectId)
            .describe('Project id (optional, will use "default" if not specified)'),
          (value = '') => {
            return languageServices.projects().filter(project => project.id.startsWith(value)).map(prop('id'))
          },
        ),
        viewId: completable(
          z.string().describe('View ID to apply semantic layout to'),
          async (_value, ctx) => {
            const projectId = ctx?.arguments?.['projectId'] ?? languageServices.projectsManager.default.id
            const model = await languageServices.computedModel(projectId as ProjectId)
            if (!model) {
              return []
            }
            const value = _value ?? ''
            return Array.from(model.views()).filter((view) => view.id.startsWith(value)).map(prop('id'))
          },
        ),
      },
      outputSchema: {
        reasoning: z.string().describe('Reasoning behind the layout changes'),
        snapshotUri: z.string().nullish().describe('Where snapshot was saved (after applying layout)'),
      },
    },
    async (args, ctx) => {
      const projectId = languageServices.projectsManager.ensureProjectId(args.projectId as ProjectId)
      if (projectId !== args.projectId) {
        await mcpServer.sendLoggingMessage({
          level: 'notice',
          data: `Using project "${projectId}" instead of "${args.projectId}"`,
        }, ctx.sessionId)
      }
      const model = await languageServices.computedModel(projectId)
      const view = model.findView(args.viewId)
      if (!view) {
        return toolError(`View "${args.viewId}" not found in project "${projectId}"`)
      }

      const hints = await enhanceLayoutWithAI(view.$view, {
        name: 'MCP',
        async sendRequest({ systemPrompt, userPrompt, diagram }) {
          const response = await ctx.sendRequest(
            {
              method: 'sampling/createMessage',
              params: {
                maxTokens: 20000,
                includeContext: 'none',
                systemPrompt,
                messages: [
                  {
                    role: 'user',
                    content: {
                      type: 'text',
                      text: userPrompt + '\n\n' + diagram,
                    },
                  },
                ],
              },
            },
            z.object({
              content: z.object({
                type: z.literal('text'),
                text: z.string(),
              }),
            }),
          )
          return response.content.type === 'text' ? response.content.text : JSON.stringify(response.content)
        },
      }, ctx.signal)

      if (!hints) {
        await mcpServer.sendLoggingMessage({
          level: 'error',
          data: 'Failed to generate layout hints',
        }, ctx.sessionId)
        return toolError('Failed to generate layout hints')
      }

      await mcpServer.sendLoggingMessage({
        level: 'info',
        data: 'Applying semantic layout...',
      }, ctx.sessionId)

      const result = await languageServices.views.layouter.aiLayout({
        view: view.$view,
        styles: model.$styles,
      }, hints)

      const change = await languageServices.editor.applyChange({
        change: {
          op: 'save-view-snapshot',
          layout: result.diagram,
        },
        viewId: view.id,
        projectId,
      })
      await mcpServer.sendLoggingMessage({
        level: 'info',
        data: 'Layout applied successfully',
      }, ctx.sessionId)

      const structuredContent = {
        reasoning: hints.reasoning,
        ...(!!change.location && { snapshotUri: change.location.uri.toString() }),
      }

      return {
        content: [],
        structuredContent,
      }

      // return {
      //   content: [
      //     {
      //       type: 'text',
      //       text: `Semantic layout applied\n\n${hints.reasoning}`,
      //     },
      //     {
      //       type: 'resource_link',
      //       uri: change.location,
      //     },
      //   ],
      // }
    },
  )

  return mcpServer
}
