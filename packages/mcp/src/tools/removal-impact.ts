import { invariant } from '@likec4/core'
import { URI } from 'vscode-uri'
import * as z from 'zod/v4'
import { likec4Tool } from '../utils'
import { projectIdSchema } from './_common'

export const removalImpact = likec4Tool({
  name: 'removal-impact',
  description: `
Report what removing an element from the model takes with it (safe delete dry run, blast radius).

Request:
- id: string — element id (FQN)
- project: string (optional) — project id. Defaults to "default" if omitted.

Response (JSON object):
- elements: string[] — removed elements: the element and its descendants (FQNs)
- relationships: number — relationships with a removed element as source or target
- deployedInstances: string[] — deployed instances of removed elements
- emptyDeploymentNodes: string[] — deployment nodes left without deployed instances
- affectedViews: string[] — views that show a removed element or relationship
- scopedViews: string[] — views scoped to a removed element
- orphans: string[] — elements left without relationships (suggested for removal, not removed automatically)
- references: Array<{ kind, resolution, text, path, line }> — source references to removed elements
  - kind: where the reference is (relation, extend-element, deployed-instance, view-predicate, view-scope, dynamic-step, diff, ...)
  - resolution: "removed" (removed together with the element), "optional" (removed only on request), "manual" (fix manually)
  - text: source text of the node with the reference
  - path, line: location (line is 1-based)

Notes:
- Read-only, idempotent, no side effects. Nothing is removed.
- Use before refactoring to understand the impact of removing an element.
`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Removal impact',
  },
  inputSchema: {
    id: z.string().describe('Element id (FQN)'),
    project: projectIdSchema,
  },
  outputSchema: {
    elements: z.array(z.string()),
    relationships: z.number(),
    deployedInstances: z.array(z.string()),
    emptyDeploymentNodes: z.array(z.string()),
    affectedViews: z.array(z.string()),
    scopedViews: z.array(z.string()),
    orphans: z.array(z.string()),
    references: z.array(z.object({
      kind: z.string(),
      resolution: z.enum(['removed', 'optional', 'manual']),
      text: z.string(),
      path: z.string(),
      line: z.number(),
    })),
  },
})(async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const report = await languageServices.removalImpact.analyze([args.id], projectId)
  invariant(report, `Element "${args.id}" not found in project "${projectId}"`)
  const { impact } = report
  return {
    elements: [...impact.elements],
    relationships: impact.relations.length,
    deployedInstances: [...impact.deployedInstances],
    emptyDeploymentNodes: [...impact.emptyDeploymentNodes],
    affectedViews: [...impact.affectedViews],
    scopedViews: [...impact.scopedViews],
    orphans: [...impact.orphans],
    references: report.references.map(reference => ({
      kind: reference.kind,
      resolution: reference.resolution,
      text: reference.text,
      path: URI.parse(reference.location.uri).fsPath,
      line: reference.location.range.start.line + 1,
    })),
  }
})
