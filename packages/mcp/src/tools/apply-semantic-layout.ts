import type { LikeC4LanguageServices } from '@likec4/language-server'
import { enhanceLayoutWithAI } from '@likec4/layouts/ai'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod/v3'
import { projectIdSchema } from './_common'

export function registerApplySemanticLayoutTool(
  mcpServer: McpServer,
  languageServices: LikeC4LanguageServices,
): McpServer {
  mcpServer.registerTool(
    'apply-semantic-layout',
    {
      description: 'Apply semantic layout to the view',
      inputSchema: {
        projectId: projectIdSchema,
        // projectId: completable(projectIdSchema, (_value) => {
        //   const value = _value ?? ''
        //   return languageServices.projects().filter(project => project.id.startsWith(value)).map(prop('id'))
        // }),
        viewId: z.string().describe('View ID to apply semantic layout to'),
      },
    },
    async (args, ctx) => {
      const projectId = languageServices.projectsManager.ensureProjectId(args.projectId)
      const model = await languageServices.computedModel(projectId)
      const view = model.view(args.viewId)

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
        return {
          content: [{
            type: 'text',
            text: 'Failed to generate layout hints',
          }],
        }
      }

      const result = await languageServices.views.layouter.aiLayout({
        view: view.$view,
        styles: model.$styles,
      }, hints)

      if (result) {
        await languageServices.editor.applyChange({
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
      }

      return {
        content: [{
          type: 'text',
          text: `Semantic layout applied\n\n${hints.reasoning}`,
        }],
      }
    },
  )

  return mcpServer
}
