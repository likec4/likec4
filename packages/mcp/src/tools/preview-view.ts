import { fromSources } from '@likec4/language-services/node'
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { relative, sep } from 'node:path'
import * as z from 'zod/v3'
import { useLanguageServices } from '../ctx'
import { buildRenderPayload, projectIdSchema, toolError } from './_common'
import { renderViewResourceUri } from './render-view'

const VIEW_ID_PATTERN = /^\s*view\s+([A-Za-z_][\w-]*)/

export function extractViewId(dsl: string): string | null {
  const match = VIEW_ID_PATTERN.exec(dsl)
  return match ? match[1]! : null
}

function wrapAsViewsBlock(dsl: string): string {
  return `views {\n${dsl}\n}\n`
}

function toPortablePath(path: string): string {
  return path.split(sep).join('/')
}

function toVirtualSourcePath(projectFolder: string, documentPath: string, fallback: string): string {
  const relativePath = toPortablePath(relative(projectFolder, documentPath))
  return relativePath === '' || relativePath.startsWith('..') ? fallback : relativePath
}

function formatDiagnostics(
  diagnostics: ReadonlyArray<{
    message: string
    range: { start: { line: number; character: number } }
  }>,
): string {
  return diagnostics
    .map(d => `- line ${d.range.start.line + 1}, column ${d.range.start.character + 1}: ${d.message}`)
    .join('\n')
}

export function previewViewTool(mcpServer: McpServer): McpServer {
  registerAppTool(
    mcpServer,
    'preview-view',
    {
      title: 'Preview View',
      description:
        `Renders a preview of a LikeC4 view defined by DSL text, in the context of an existing project's real elements — without saving anything to disk.

Request:
- dsl: string — a single \`view <id> ... { ... }\` definition. It must reference elements that already exist in the target project.
- project: string (optional) — project id. Defaults to "default" if omitted.

Behavior:
- The view id must be new (not already present in the project). If the view id matches an existing view, an error is returned — use a different id, or use "render-view" to render an existing view.
- The view is rendered as a draft alongside the project's real elements.

Note: preview styling may not exactly match the real project (custom theme/style extensions aren't applied to the preview). Only \`view <id> ...\` (element view) declarations are recognized for id-detection — a \`dynamic view <id> {...}\` or \`deployment view <id> {...}\` will fail with a generic "could not find a \`view <id>\`" error instead.

Use "preview-view" to iterate on a new view definition before creating it for real. Use "render-view" to render a view that's already saved.`,
      inputSchema: {
        dsl: z.string().describe('A single `view <id> ... { ... }` LikeC4 DSL definition'),
        project: projectIdSchema,
      },
      outputSchema: {
        id: z.string(),
        title: z.string(),
        project: z.string(),
        view: z.record(z.string(), z.unknown()),
        model: z.record(z.string(), z.unknown()),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        title: 'Preview view',
      },
      _meta: {
        ui: { resourceUri: renderViewResourceUri },
      },
    },
    async (args): Promise<CallToolResult> => {
      const languageServices = useLanguageServices()
      const projectId = languageServices.projectsManager.ensureProjectId(args.project)

      const rawViewId = extractViewId(args.dsl)
      if (!rawViewId) {
        return toolError(
          'Could not find a `view <id> ...` declaration at the start of `dsl`. '
            + 'Example: `view myView of someElement { include * }`',
        )
      }

      const project = languageServices.project(projectId)

      const existingModel = await languageServices.computedModel(projectId)
      if (existingModel?.findView(rawViewId)) {
        return toolError(
          `View "${rawViewId}" already exists in the project. `
            + 'Use a different view id for the preview, or use "render-view" to render the existing view.',
        )
      }

      const sources: Record<string, string> = {}
      for (const [index, uri] of project.documents.entries()) {
        const filePath = toVirtualSourcePath(project.folder.fsPath, uri.fsPath, `seed-${index}.c4`)
        sources[filePath] = languageServices.documentText(uri.toString()) ?? ''
      }
      sources['preview-view.c4'] = wrapAsViewsBlock(args.dsl)

      // Build a separate production instance from virtual sources to keep preview isolated.
      await using preview = await fromSources(sources, {
        printErrors: false,
        throwIfInvalid: false,
      })

      const errors = preview.getErrors()

      if (errors.length > 0) {
        return toolError(`Failed to build preview:\n${formatDiagnostics(errors)}`)
      }

      const model = await preview.computedModel()
      const viewModel = model.findView(rawViewId)
      if (!viewModel) {
        return toolError(`View "${rawViewId}" was not found after building the preview.`)
      }

      const layouted = await preview.viewsService.layoutView({
        viewId: viewModel.id,
        projectId,
      })
      if (!layouted) {
        return toolError(`Failed to layout preview view "${rawViewId}".`)
      }

      const title = viewModel.title ?? viewModel.id

      return {
        content: [{
          type: 'text',
          text: `Rendered preview of view "${title}"`,
        }],
        structuredContent: buildRenderPayload({
          projectId,
          viewId: viewModel.id,
          title,
          layoutedView: layouted.diagram,
          modelData: model.$data,
        }),
      }
    },
  )
  return mcpServer
}
