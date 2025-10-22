import { invariant } from '@likec4/core'
import * as z from 'zod/v3'
import { likec4Tool } from '../utils'
import { includedInViews, includedInViewsSchema, locationSchema, mkLocate, projectIdSchema } from './_common'

export const readElement = likec4Tool({
  name: 'read-element',
  description: `
Read detailed information about a LikeC4 element.

Request:
- id: string — element id (FQN)
- project: string (optional) — project id. Defaults to "default" if omitted.

Response (JSON object):
- id: string — element id (FQN)
- name: string — element name
- kind: string — element kind
- title: string — human-readable title
- description: string|null — optional description
- technology: string|null — optional technology
- tags: string[] — assigned tags
- project: string — project id this element belongs to
- metadata: Record<string, string> — element metadata
- shape: string — rendered shape
- color: string — rendered color
- children: string[] — ids (FQNs) of direct child elements
- defaultView: string|null — default view name if set
- includedInViews: View[] — views that include this element
- relationships: object — relationships of this element (direct and indirect)
  - incoming: Array<{ source: { id: string, title: string, kind: string }, kind: string|null, target: string, title: string|null, description: string|null, technology: string|null, tags: string[] }>
  - outgoing: Array<{ source: string, target: { id: string, title: string, kind: string }, kind: string|null, title: string|null, description: string|null, technology: string|null, tags: string[] }>
- deployedInstances: string[] — deployed instance ids (Deployment FQNs)
- sourceLocation: { path: string, range: { start: { line: number, character: number }, end: { line: number, character: number } } } | null — source location if available

View (object) fields:
- id: string — view identifier
- title: string — view title
- type: "element" | "deployment" | "dynamic"

Notes:
- Read-only, idempotent, no side effects.
- Safe to call repeatedly.

Example response:
{
  "id": "shop.frontend",
  "name": "frontend",
  "kind": "container",
  "title": "Frontend",
  "description": "User-facing web app",
  "technology": "React",
  "tags": ["public"],
  "project": "default",
  "metadata": { "owner": "web" },
  "shape": "rounded-rectangle",
  "color": "#2F80ED",
  "children": ["shop.frontend.auth"],
  "defaultView": "frontend-overview",
  "includedInViews": [
    {
      "id": "frontend-overview",
      "title": "Frontend Overview",
      "type": "element"
    }
  ],
  "relationships": {
    "incoming": [
      {
        "source": { "id": "shop.api", "title": "API", "kind": "container" },
        "kind": "uses",
        "target": "shop.frontend",
        "title": "Calls",
        "description": null,
        "technology": "HTTPS",
        "tags": []
      }
    ],
    "outgoing": []
  },
  "deployedInstances": ["k8s.cluster.frontend"],
  "sourceLocation": {
    "path": "/abs/path/project/model.c4",
    "range": { "start": { "line": 10, "character": 0 }, "end": { "line": 25, "character": 0 } }
  }
}
`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Read element',
  },
  inputSchema: {
    id: z.string().describe('Element id (FQN)'),
    project: projectIdSchema,
  },
  outputSchema: {
    id: z.string().describe('Element id (FQN)'),
    kind: z.string().describe('Element kind'),
    name: z.string().describe('Element name'),
    title: z.string(),
    description: z.string().nullable(),
    technology: z.string().nullable(),
    tags: z.array(z.string()),
    project: z.string(),
    metadata: z.record(z.union([z.string(), z.array(z.string())])),
    shape: z.string(),
    color: z.string(),
    children: z.array(z.string()).describe('Children of this element (Array of FQNs)'),
    defaultView: z.string().nullable().describe('Name of the default view of this element'),
    includedInViews: includedInViewsSchema.describe('Views that include this element'),
    relationships: z.object({
      incoming: z.array(z.object({
        source: z.object({
          id: z.string(),
          title: z.string(),
          kind: z.string(),
        }).describe('Source element of this relationship'),
        kind: z.string().nullable().describe('Relationship kind'),
        target: z.string().describe(
          'Target element id (FQN), either this element or nested element, if relationship is indirect',
        ),
        title: z.string().nullable().describe('Relationship title'),
        description: z.string().nullable().describe('Relationship description'),
        technology: z.string().nullable().describe('Relationship technology'),
        tags: z.array(z.string()).describe('Relationship tags'),
      })).describe('Incoming relationships of this element (direct and indirect, incoming to nested elements)'),
      outgoing: z.array(z.object({
        source: z.string().describe(
          'Source element id (FQN), either this element or nested element, if relationship is indirect',
        ),
        target: z.object({
          id: z.string(),
          title: z.string(),
          kind: z.string(),
        }).describe('Target element of this relationship'),
        kind: z.string().nullable().describe('Relationship kind'),
        title: z.string().nullable().describe('Relationship title'),
        description: z.string().nullable().describe('Relationship description'),
        technology: z.string().nullable().describe('Relationship technology'),
        tags: z.array(z.string()).describe('Relationship tags'),
      })).describe('Outgoing relationships of this element (direct and indirect, outgoing from nested elements)'),
    }).describe('Relationships of this element'),
    deployedInstances: z.array(z.string()).describe('Deployed instances of this element (Array of Deployment FQNs)'),
    sourceLocation: locationSchema,
  },
}, async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)
  const element = model.findElement(args.id)
  invariant(element, `Element "${args.id}" not found in project "${projectId}"`)

  const locate = mkLocate(languageServices, projectId)

  return {
    id: element.id,
    name: element.name,
    kind: element.kind,
    title: element.title,
    description: element.description.text,
    technology: element.technology,
    tags: [...element.tags],
    project: projectId,
    metadata: element.getMetadata(),
    shape: element.shape,
    color: element.color,
    children: [...element.children()].map(c => c.id),
    defaultView: element.defaultView?.id || null,
    includedInViews: includedInViews(element.views()),
    relationships: {
      incoming: [...element.incoming()].map(r => ({
        source: {
          id: r.source.id,
          title: r.source.title,
          kind: r.source.kind,
        },
        kind: r.kind,
        target: r.target.id,
        title: r.title,
        description: r.description.text,
        technology: r.technology,
        tags: [...r.tags],
      })),
      outgoing: [...element.outgoing()].map(r => ({
        source: r.source.id,
        target: {
          id: r.target.id,
          title: r.target.title,
          kind: r.target.kind,
        },
        kind: r.kind,
        title: r.title,
        description: r.description.text,
        technology: r.technology,
        tags: [...r.tags],
      })),
    },
    deployedInstances: [...element.deployments()].map(i => i.id),
    sourceLocation: locate({ element: element.id }),
  }
})
