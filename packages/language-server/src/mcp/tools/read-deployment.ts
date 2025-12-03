// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2025 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { invariant } from '@likec4/core'
import * as z from 'zod/v3'
import { likec4Tool } from '../utils'
import { includedInViews, includedInViewsSchema, locationSchema, mkLocate, projectIdSchema } from './_common'

export const readDeployment = likec4Tool({
  name: 'read-deployment',
  description: `
Read details about a deployment node or a deployed instance in a LikeC4 project.

What it does:
- Returns metadata about a deployment entity (node or instance), including kind, tags, color/shape, children, which views include it, and its source location.

Inputs:
- id: string — Deployment id (FQN)
- project: string (optional, defaults to "default") — Project id

Output fields:
- type: "deployment-node" | "deployed-instance"
- id: string — Deployment id (FQN)
- kind: string — Deployment node kind, or element kind for deployed instances
- name: string — Name of the deployment entity
- title: string — Title of the deployment entity
- description: string|null — Description text
- technology: string|null — Technology info, if any
- tags: string[] — Tags assigned to this entity
- project: string — Project id
- metadata: Record<string, string>
- links: Array<{ title: string|null, url: string, relative: string|null }> — external links associated with this deployment entity
- shape: string — Rendered shape
- color: string — Rendered color
- children: string[] — Child deployment ids (empty for instances)
- includedInViews: View[] — Views that include this entity
- instanceof: { id: string, title: string, kind: string } | null — If type is "deployed-instance", the referenced element
- sourceLocation: { path: string, range: { start: { line: number, character: number }, end: { line: number, character: number } } } | null

View (object) fields:
- id: string — view identifier
- title: string — view title
- type: "element" | "deployment" | "dynamic"

Notes:
- Read-only, idempotent; does not mutate the model.

Example request:
{ "id": "k8s.cluster.frontend", "project": "default" }

Example response (deployed instance):
{
  "type": "deployed-instance",
  "id": "k8s.cluster.frontend",
  "kind": "k8s.pod",
  "name": "frontend",
  "title": "Frontend Pod",
  "description": null,
  "technology": "Kubernetes",
  "tags": ["prod"],
  "project": "default",
  "metadata": {},
  "links": [],
  "shape": "rectangle",
  "color": "#2F80ED",
  "children": [],
  "includedInViews": [
    { "id": "runtime-overview", "title": "Runtime Overview", "type": "deployment" }
  ],
  "instanceof": { "id": "shop.frontend", "title": "Frontend", "kind": "component" },
  "sourceLocation": {
    "path": "/abs/path/project/model.c4",
    "range": { "start": { "line": 10, "character": 0 }, "end": { "line": 25, "character": 0 } }
  }
}
`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Read deployment entity',
  },
  inputSchema: {
    id: z.string().describe('Deployment id (FQN)'),
    project: projectIdSchema,
  },
  outputSchema: {
    type: z.enum(['deployment-node', 'deployed-instance']),
    id: z.string().describe('Deployment id (FQN)'),
    kind: z.string().describe('Deployment node kind, or element kind for deployed instances'),
    name: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    technology: z.string().nullable(),
    tags: z.array(z.string()),
    project: z.string(),
    metadata: z.record(z.union([z.string(), z.array(z.string())])),
    links: z.array(z.object({
      title: z.string().nullable().describe('Optional link title'),
      url: z.string().describe('Link URL'),
      relative: z.string().nullable().describe('Relative path (if URL is relative to workspace root)'),
    })).describe('External links associated with this deployment entity'),
    shape: z.string(),
    color: z.string(),
    children: z.array(z.string()).describe('Children of this deployment node (Array of Deployment ids)'),
    includedInViews: includedInViewsSchema.describe('Views that include this deployment node'),
    instanceof: z.object({
      id: z.string().describe('Element ID (FQN)'),
      title: z.string(),
      kind: z.string(),
    }).nullable().describe('If type is "deployed-instance", the referenced element'),
    sourceLocation: locationSchema,
  },
}, async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)
  const element = model.deployment.findElement(args.id)
  invariant(element, `Deployment entity "${args.id}" not found in project "${projectId}"`)

  const locate = mkLocate(languageServices, projectId)

  return {
    type: element.isInstance() ? 'deployed-instance' : 'deployment-node',
    id: element.id,
    name: element.name,
    kind: element.kind,
    title: element.title,
    description: element.description.text,
    technology: element.technology,
    tags: [...element.tags],
    project: projectId,
    metadata: element.getMetadata(),
    links: (element.links ?? []).map(link => ({
      title: link.title ?? null,
      url: link.url,
      relative: link.relative ?? null,
    })),
    shape: element.shape,
    color: element.color,
    children: element.isInstance() ? [] : [...element.children()].map(c => c.id),
    includedInViews: includedInViews(element.views()),
    instanceof: element.isInstance()
      ? {
        id: element.element.id,
        title: element.element.title,
        kind: element.element.kind,
      }
      : null,
    sourceLocation: locate({ deployment: element.id }),
  }
})
