import { registerAppTool } from '@modelcontextprotocol/ext-apps/server'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import * as z from 'zod/v3'
import { useLanguageServices } from '../ctx'
import { buildRenderPayload, projectIdSchema, toolError } from './_common'

export const renderViewResourceUri = 'ui://likec4/render-view.html'

export function renderViewTool(mcpServer: McpServer): McpServer {
  registerAppTool(
    mcpServer,
    'render-view',
    {
      title: 'Render View',
      description: `Renders a LikeC4 view as an interactive diagram (pan/zoom/fit) inline in the chat.

Request:
- viewId: string — view id (name)
- project: string (optional) — project id. Defaults to "default" if omitted.

Use this when the user wants to *see* a view. Use "read-view" instead when only the view's structure (nodes/edges) is needed.`,
      inputSchema: {
        viewId: z.string().describe('View id (name)'),
        project: projectIdSchema,
      },
      outputSchema: {
        id: z.string(),
        title: z.string(),
        project: z.string(),
        view: z.record(z.string(), z.unknown())
          .describe('Full layouted view (nodes, edges, bounds), consumed by the paired render-view UI'),
        model: z.record(z.string(), z.unknown())
          .describe(
            'Layouted model data (specification, elements, relations, deployments), scoped to this view only. '
              + 'Consumed by the paired UI to build a LikeC4Model for LikeC4ModelProvider — LikeC4Diagram requires one in context.',
          ),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        title: 'Render view',
      },
      _meta: {
        ui: { resourceUri: renderViewResourceUri },
      },
    },
    async (args): Promise<CallToolResult> => {
      const languageServices = useLanguageServices()
      const projectId = languageServices.projectsManager.ensureProjectId(args.project)
      const model = await languageServices.layoutedModel(projectId)
      const viewModel = model.findView(args.viewId)

      if (!viewModel) {
        return toolError(`View with ID '${args.viewId}' not found in project ${projectId}`)
      }
      if (!viewModel.isLayouted()) {
        return toolError(`View '${args.viewId}' has no layout`)
      }

      const layoutedView = viewModel.$layouted
      const title = viewModel.title ?? viewModel.id

      // LikeC4Diagram unconditionally reads model.specification (tag colors) via
      // TagStylesProvider, so the UI needs a real LikeC4Model, not just the view.
      // buildRenderPayload ships the full model data but scopes `views` down to
      // just this one — other views' layouts aren't needed to render a single view.
      return {
        content: [{
          type: 'text',
          text: `Rendered view "${title}"`,
        }],
        structuredContent: buildRenderPayload({
          projectId,
          viewId: viewModel.id,
          title,
          layoutedView,
          modelData: model.$data,
        }),
      }
    },
  )
  return mcpServer
}
