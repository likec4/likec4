// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { invariant } from '@likec4/core'
import * as z from 'zod/v4'
import { likec4Tool } from '../utils'
import { type ElementSummary, elementSummarySchema, projectIdSchema, serializeElement } from './_common'

const queryTypeSchema = z.enum([
  'ancestors',
  'descendants',
  'siblings',
  'children',
  'parent',
  'incomers',
  'outgoers',
])

const MAX_RESULTS = 100

export const queryGraph = likec4Tool({
  name: 'query-graph',
  description:
    `One-step graph query around an element. Hierarchy: ancestors (up to the root), descendants (recursive), siblings, children, parent (empty for a root element); includeIndirect is ignored for these. Relationships: incomers and outgoers, single hop; includeIndirect (default true) adds relationships of nested children. For recursive traversal, use query-incomers-graph or query-outgoers-graph. At most 100 results.`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Query element graph',
  },
  inputSchema: {
    elementId: z.string().describe('Element id (FQN) to query'),
    queryType: queryTypeSchema.describe('Type of graph query'),
    includeIndirect: z.boolean().optional().default(true).describe(
      'For incomers/outgoers: include indirect relationships (default: true)',
    ),
    project: projectIdSchema,
  },
  outputSchema: {
    results: z.array(elementSummarySchema),
    truncated: z.boolean().describe('True if results were truncated due to exceeding maximum limit'),
  },
})(async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)
  const element = model.findElement(args.elementId)
  invariant(element, `Element "${args.elementId}" not found in project "${projectId}"`)

  const results: ElementSummary[] = []
  let truncated = false

  switch (args.queryType) {
    case 'ancestors': {
      for (const ancestor of element.ancestors()) {
        if (results.length >= MAX_RESULTS) {
          truncated = true
          break
        }
        results.push(serializeElement(ancestor))
      }
      break
    }

    case 'descendants': {
      for (const descendant of element.descendants()) {
        if (results.length >= MAX_RESULTS) {
          truncated = true
          break
        }
        results.push(serializeElement(descendant))
      }
      break
    }

    case 'siblings': {
      for (const sibling of element.siblings()) {
        if (results.length >= MAX_RESULTS) {
          truncated = true
          break
        }
        results.push(serializeElement(sibling))
      }
      break
    }

    case 'children': {
      for (const child of element.children()) {
        if (results.length >= MAX_RESULTS) {
          truncated = true
          break
        }
        results.push(serializeElement(child))
      }
      break
    }

    case 'parent': {
      const parent = element.parent
      if (parent) {
        results.push(serializeElement(parent))
      }
      break
    }

    case 'incomers': {
      const filter = args.includeIndirect ? 'all' : 'direct'
      for (const incomer of element.incomers(filter)) {
        if (results.length >= MAX_RESULTS) {
          truncated = true
          break
        }
        results.push(serializeElement(incomer))
      }
      break
    }

    case 'outgoers': {
      const filter = args.includeIndirect ? 'all' : 'direct'
      for (const outgoer of element.outgoers(filter)) {
        if (results.length >= MAX_RESULTS) {
          truncated = true
          break
        }
        results.push(serializeElement(outgoer))
      }
      break
    }
  }

  return { results, truncated }
})
