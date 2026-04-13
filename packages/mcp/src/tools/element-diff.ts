// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { invariant } from '@likec4/core'
import * as z from 'zod/v3'
import { likec4Tool } from '../utils'
import { projectIdSchema } from './_common'

const elementSnapshotSchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  technology: z.string().nullable(),
  shape: z.string(),
  color: z.string(),
})

const diffSchema = z.object({
  element1: elementSnapshotSchema,
  element2: elementSnapshotSchema,
  propertyDiffs: z.array(z.object({
    property: z.string().describe('Property name'),
    element1Value: z.string().nullable().describe('Value in element1'),
    element2Value: z.string().nullable().describe('Value in element2'),
  })).describe('Properties that differ between the two elements'),
  tags: z.object({
    onlyInElement1: z.array(z.string()).describe('Tags present only in element1'),
    onlyInElement2: z.array(z.string()).describe('Tags present only in element2'),
    common: z.array(z.string()).describe('Tags present in both elements'),
  }),
  metadata: z.object({
    onlyInElement1: z.record(z.union([z.string(), z.array(z.string())])).describe('Metadata keys only in element1'),
    onlyInElement2: z.record(z.union([z.string(), z.array(z.string())])).describe('Metadata keys only in element2'),
    different: z.array(z.object({
      key: z.string(),
      element1Value: z.union([z.string(), z.array(z.string())]),
      element2Value: z.union([z.string(), z.array(z.string())]),
    })).describe('Metadata keys present in both but with different values'),
    common: z.record(z.union([z.string(), z.array(z.string())])).describe(
      'Metadata keys with identical values in both',
    ),
  }),
  relationships: z.object({
    incomingOnlyElement1: z.number().describe('Count of unique source elements sending to element1 only'),
    incomingOnlyElement2: z.number().describe('Count of unique source elements sending to element2 only'),
    incomingShared: z.number().describe('Count of unique source elements sending to both'),
    outgoingOnlyElement1: z.number().describe('Count of unique target elements receiving from element1 only'),
    outgoingOnlyElement2: z.number().describe('Count of unique target elements receiving from element2 only'),
    outgoingShared: z.number().describe('Count of unique target elements receiving from both'),
  }),
})

export const elementDiff = likec4Tool({
  name: 'element-diff',
  description: `
Compare two elements side-by-side, showing differences in properties, tags, metadata, and relationships.

Request:
- element1Id: string — first element id (FQN)
- element2Id: string — second element id (FQN)
- project: string (optional) — project id. Defaults to "default" if omitted.

Response (JSON object):
- element1: object — snapshot of first element (id, kind, title, description, technology, shape, color)
- element2: object — snapshot of second element
- propertyDiffs: Array of { property, element1Value, element2Value } — properties that differ
- tags: object
  - onlyInElement1: string[] — tags only in element1
  - onlyInElement2: string[] — tags only in element2
  - common: string[] — tags in both
- metadata: object
  - onlyInElement1: Record — metadata keys only in element1
  - onlyInElement2: Record — metadata keys only in element2
  - different: Array of { key, element1Value, element2Value } — keys present in both but with different values
  - common: Record — metadata keys with identical values in both
- relationships: object — relationship count comparison
  - incomingOnlyElement1/incomingOnlyElement2/incomingShared
  - outgoingOnlyElement1/outgoingOnlyElement2/outgoingShared

Notes:
- Read-only, idempotent, no side effects.
- Safe to call repeatedly.
- Both elements must exist in the same project.
- Useful for comparing similar nodes to understand why they have different configurations.

Example response:
{
  "element1": { "id": "planner.nodeA", "kind": "cgf-node", "title": "nodeA", ... },
  "element2": { "id": "planner.nodeB", "kind": "cgf-node", "title": "nodeB", ... },
  "propertyDiffs": [
    { "property": "title", "element1Value": "nodeA :dwNodeTypeA", "element2Value": "nodeB :dwNodeTypeB" }
  ],
  "tags": {
    "onlyInElement1": ["target_asil_qm"],
    "onlyInElement2": ["target_asil_asil_b"],
    "common": ["is_in_dag", "process_camera_master"]
  },
  "metadata": {
    "onlyInElement1": {},
    "onlyInElement2": {},
    "different": [
      { "key": "target_asil", "element1Value": "QM", "element2Value": "ASIL-B" }
    ],
    "common": { "host": "machine0" }
  },
  "relationships": {
    "incomingOnlyElement1": 2,
    "incomingOnlyElement2": 1,
    "incomingShared": 3,
    "outgoingOnlyElement1": 0,
    "outgoingOnlyElement2": 1,
    "outgoingShared": 2
  }
}
`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Compare two elements',
  },
  inputSchema: {
    element1Id: z.string().describe('First element id (FQN)'),
    element2Id: z.string().describe('Second element id (FQN)'),
    project: projectIdSchema,
  },
  outputSchema: diffSchema.shape,
}, async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)

  const el1 = model.findElement(args.element1Id)
  invariant(el1, `Element "${args.element1Id}" not found in project "${projectId}"`)

  const el2 = model.findElement(args.element2Id)
  invariant(el2, `Element "${args.element2Id}" not found in project "${projectId}"`)

  // Property diffs
  const propertyDiffs: Array<{ property: string; element1Value: string | null; element2Value: string | null }> = []
  const propsToCompare = [
    { name: 'kind', get: (e: typeof el1) => e.kind },
    { name: 'title', get: (e: typeof el1) => e.title },
    { name: 'description', get: (e: typeof el1) => e.description.text },
    { name: 'technology', get: (e: typeof el1) => e.technology },
    { name: 'shape', get: (e: typeof el1) => e.shape },
    { name: 'color', get: (e: typeof el1) => e.color },
  ] as const

  for (const prop of propsToCompare) {
    const v1 = prop.get(el1)
    const v2 = prop.get(el2)
    if (v1 !== v2) {
      propertyDiffs.push({
        property: prop.name,
        element1Value: v1,
        element2Value: v2,
      })
    }
  }

  // Tag diffs
  const tags1 = new Set(el1.tags)
  const tags2 = new Set(el2.tags)
  const commonTags: string[] = []
  const onlyInElement1Tags: string[] = []
  const onlyInElement2Tags: string[] = []

  for (const tag of tags1) {
    if (tags2.has(tag)) {
      commonTags.push(tag)
    } else {
      onlyInElement1Tags.push(tag)
    }
  }
  for (const tag of tags2) {
    if (!tags1.has(tag)) {
      onlyInElement2Tags.push(tag)
    }
  }

  // Metadata diffs
  const meta1 = el1.getMetadata()
  const meta2 = el2.getMetadata()
  const allKeys = new Set([...Object.keys(meta1), ...Object.keys(meta2)])

  const onlyInElement1Meta: Record<string, string | string[]> = {}
  const onlyInElement2Meta: Record<string, string | string[]> = {}
  const differentMeta: Array<{
    key: string
    element1Value: string | string[]
    element2Value: string | string[]
  }> = []
  const commonMeta: Record<string, string | string[]> = {}

  for (const key of allKeys) {
    const v1 = meta1[key]
    const v2 = meta2[key]
    if (v1 !== undefined && v2 === undefined) {
      onlyInElement1Meta[key] = v1
    } else if (v1 === undefined && v2 !== undefined) {
      onlyInElement2Meta[key] = v2
    } else if (v1 !== undefined && v2 !== undefined) {
      if (JSON.stringify(v1) === JSON.stringify(v2)) {
        commonMeta[key] = v1
      } else {
        differentMeta.push({ key, element1Value: v1, element2Value: v2 })
      }
    }
  }

  // Relationship diffs
  const incoming1Sources = new Set([...el1.incoming()].map(r => r.source.id))
  const incoming2Sources = new Set([...el2.incoming()].map(r => r.source.id))
  const outgoing1Targets = new Set([...el1.outgoing()].map(r => r.target.id))
  const outgoing2Targets = new Set([...el2.outgoing()].map(r => r.target.id))

  let incomingShared = 0
  let incomingOnly1 = 0
  let incomingOnly2 = 0
  for (const src of incoming1Sources) {
    if (incoming2Sources.has(src)) incomingShared++
    else incomingOnly1++
  }
  for (const src of incoming2Sources) {
    if (!incoming1Sources.has(src)) incomingOnly2++
  }

  let outgoingShared = 0
  let outgoingOnly1 = 0
  let outgoingOnly2 = 0
  for (const tgt of outgoing1Targets) {
    if (outgoing2Targets.has(tgt)) outgoingShared++
    else outgoingOnly1++
  }
  for (const tgt of outgoing2Targets) {
    if (!outgoing1Targets.has(tgt)) outgoingOnly2++
  }

  return {
    element1: {
      id: el1.id,
      kind: el1.kind,
      title: el1.title,
      description: el1.description.text,
      technology: el1.technology,
      shape: el1.shape,
      color: el1.color,
    },
    element2: {
      id: el2.id,
      kind: el2.kind,
      title: el2.title,
      description: el2.description.text,
      technology: el2.technology,
      shape: el2.shape,
      color: el2.color,
    },
    propertyDiffs,
    tags: {
      onlyInElement1: onlyInElement1Tags,
      onlyInElement2: onlyInElement2Tags,
      common: commonTags,
    },
    metadata: {
      onlyInElement1: onlyInElement1Meta,
      onlyInElement2: onlyInElement2Meta,
      different: differentMeta,
      common: commonMeta,
    },
    relationships: {
      incomingOnlyElement1: incomingOnly1,
      incomingOnlyElement2: incomingOnly2,
      incomingShared,
      outgoingOnlyElement1: outgoingOnly1,
      outgoingOnlyElement2: outgoingOnly2,
      outgoingShared,
    },
  }
})
