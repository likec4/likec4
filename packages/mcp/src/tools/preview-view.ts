// Uses the test-harness factory to build a throwaway, isolated language-server
// instance per call. `/test` resolves to raw TS source (no `dist` build target) —
// this only works because @likec4/mcp is always bundled with the `sources`
// condition by tsdown. If that ever changes, this import would need a real
// production-facing factory instead.
import { createTestServices } from '@likec4/language-server/test'
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
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

function formatDiagnostics(
  diagnostics: ReadonlyArray<{ message: string; range: { start: { line: number; character: number } } }>,
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

      const uris = languageServices.project(projectId).documents
      const originalTexts = uris.map(uri => languageServices.documentText(uri.toString()) ?? '')

      const existingModel = await languageServices.computedModel(projectId)
      if (existingModel?.findView(rawViewId)) {
        return toolError(
          `View "${rawViewId}" already exists in the project. `
            + 'Use a different view id for the preview, or use "render-view" to render the existing view.',
        )
      }

      // a brand-new, independent instance seeded with
      // the project's documents plus the new preview view.
      const preview = createTestServices()
      for (const [index, text] of originalTexts.entries()) {
        await preview.addDocument(text, `seed-${index}.c4`)
      }
      await preview.addDocument(wrapAsViewsBlock(args.dsl), 'preview-view.c4')

      const documentBuilder = preview.services.shared.workspace.DocumentBuilder
      const langiumDocuments = preview.services.shared.workspace.LangiumDocuments

      // Single, full validated build of the final document set.
      await documentBuilder.build(langiumDocuments.all.toArray(), { validation: true })

      const errors = langiumDocuments.all
        .flatMap(doc => doc.diagnostics ?? [])
        .filter(d => d.severity === DiagnosticSeverity.Error)
        .toArray()

      if (errors.length > 0) {
        return toolError(`Failed to build preview:\n${formatDiagnostics(errors)}`)
      }

      const model = await preview.services.likec4.ModelBuilder.computeModel()
      if (!model) {
        return toolError('Failed to compute preview model.')
      }
      const viewModel = model.findView(rawViewId)
      if (!viewModel) {
        return toolError(`View "${rawViewId}" was not found after building the preview.`)
      }

      const layouted = await preview.services.likec4.Views.layoutView({ viewId: viewModel.id })
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
          viewId: rawViewId,
          title,
          layoutedView: layouted.diagram,
          modelData: model.$data,
        }),
      }
    },
  )
  return mcpServer
}
