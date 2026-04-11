// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { invariant } from '@likec4/core'
import * as z from 'zod/v3'
import { likec4Tool } from '../utils'
import { elementSummarySchema, projectIdSchema, serializeElement } from './_common'

const MAX_IDS = 50

const elementDetailSchema = elementSummarySchema.extend({
  description: z.string().nullable().describe('Element description'),
  technology: z.string().nullable().describe('Element technology'),
  shape: z.string().describe('Rendered shape'),
  color: z.string().describe('Rendered color'),
  children: z.array(z.string()).describe('Direct child element ids'),
  incomingCount: z.number().describe('Number of incoming relationships'),
  outgoingCount: z.number().describe('Number of outgoing relationships'),
})

export const batchReadElements = likec4Tool({
  name: 'batch-read-elements',
  description: `
Read details of multiple elements in a single call, reducing round-trips.
Returns a compact summary for each element including metadata, description, technology, shape, children, and relationship counts.

Request:
- ids: string[] — array of element ids (FQNs) to read (max 50)
- project: string (optional) — project id. Defaults to "default" if omitted.

Response (JSON object):
- elements: Array of element details, each with:
  - id: string — element id (FQN)
  - name: string — element name
  - kind: string — element kind
  - title: string — human-readable title
  - description: string|null — optional description
  - technology: string|null — optional technology
  - tags: string[] — assigned tags
  - metadata: Record<string, string | string[]> — element metadata
  - shape: string — rendered shape
  - color: string — rendered color
  - children: string[] — direct child element ids
  - incomingCount: number — number of incoming relationships
  - outgoingCount: number — number of outgoing relationships
  - includedInViews: View[] — views that include this element
- notFound: string[] — ids that were not found in the project

View (object) fields:
- id: string — view identifier
- title: string — view title
- type: "element" | "deployment" | "dynamic"

Notes:
- Read-only, idempotent, no side effects.
- Safe to call repeatedly.
- Maximum 50 element ids per call.
- Elements not found are listed in notFound array (not an error).
- More efficient than multiple read-element calls when you need summary data for many elements.

Example response:
{
  "elements": [
    {
      "id": "shop.frontend",
      "name": "frontend",
      "kind": "container",
      "title": "Frontend",
      "description": "User-facing web app",
      "technology": "React",
      "tags": ["public"],
      "metadata": { "owner": "web-team" },
      "shape": "browser",
      "color": "#2F80ED",
      "children": ["shop.frontend.auth"],
      "incomingCount": 2,
      "outgoingCount": 3,
      "includedInViews": [
        { "id": "system-overview", "title": "System Overview", "type": "element" }
      ]
    }
  ],
  "notFound": []
}
`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Batch read elements',
  },
  inputSchema: {
    ids: z.array(z.string()).min(1).max(MAX_IDS).describe(`Array of element ids (FQNs) to read (max ${MAX_IDS})`),
    project: projectIdSchema,
  },
  outputSchema: {
    elements: z.array(elementDetailSchema),
    notFound: z.array(z.string()).describe('Element ids that were not found'),
  },
}, async (languageServices, args) => {
  invariant(args.ids.length <= MAX_IDS, `Maximum ${MAX_IDS} element ids per call`)

  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)

  const elements: z.infer<typeof elementDetailSchema>[] = []
  const notFound: string[] = []

  for (const id of args.ids) {
    const element = model.findElement(id)
    if (!element) {
      notFound.push(id)
      continue
    }

    elements.push({
      ...serializeElement(element),
      description: element.description.text,
      technology: element.technology,
      shape: element.shape,
      color: element.color,
      children: [...element.children()].map(c => c.id),
      incomingCount: element.allIncoming.size,
      outgoingCount: element.allOutgoing.size,
    })
  }

  return { elements, notFound }
})
