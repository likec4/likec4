import type { ProjectId } from '@likec4/core'
import { completable } from '@modelcontextprotocol/sdk/server/completable.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { prop } from 'remeda'
import * as z from 'zod/v3'
import { useLanguageServices } from '../ctx'

export function applySemanticLayoutPrompt(
  mcp: McpServer,
): McpServer {
  const services = useLanguageServices()
  mcp.registerPrompt(
    'apply_semantic_layout',
    {
      title: 'Prepare prompt for applying semantic layout to a likec4 view',
      argsSchema: {
        projectId: completable(
          z.string().describe('Project id (optional, will use "default" if not specified)'),
          (value = '') => {
            return services.projects().filter(project => project.id.startsWith(value)).map(prop('id'))
          },
        ),
        viewId: completable(
          z.string().describe('View ID'),
          async (value = '', ctx) => {
            const projectId = ctx?.arguments?.['projectId'] ?? services.projectsManager.default.id
            const model = await services.computedModel(projectId as ProjectId)
            if (!model) {
              await mcp.sendLoggingMessage({
                level: 'warning',
                data: `Completing viewId for project ${projectId} with input value "${value}", model not found`,
              })

              return []
            }
            return Array.from(model.views()).filter((view) => view.id.startsWith(value)).map(prop('id'))
          },
        ),
      },
    },
    async ({ viewId, projectId }, _ctx) => {
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: [
              'Call `apply-semantic-layout` tool from `likec4` MCP with these arguments:',
              'projectId: `' + projectId + '`',
              'viewId: `' + viewId + '`',
            ].join('\n'),
          },
        }],
      }
    },
  )

  return mcp
}
