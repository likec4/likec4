// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { invariant } from '@likec4/core'
import * as z from 'zod/v4'
import { likec4Tool } from '../utils'
import {
  elementSummarySchema,
  linksSchema,
  locationSchema,
  mkLocate,
  projectIdSchema,
  serializeElement,
  serializeLinks,
} from './_common'

const MAX_IDS = 50

const elementDetailSchema = elementSummarySchema.extend({
  description: z.string().nullable().describe('Element description'),
  technology: z.string().nullable().describe('Element technology'),
  shape: z.string().describe('Rendered shape'),
  color: z.string().describe('Rendered color'),
  children: z.array(z.string()).describe('Direct child element ids'),
  incomingCount: z.number().describe('Number of incoming relationships'),
  outgoingCount: z.number().describe('Number of outgoing relationships'),
  links: linksSchema,
  sourceLocation: locationSchema,
})

export const batchReadElements = likec4Tool({
  name: 'batch-read-elements',
  description:
    `Read summaries of up to 50 elements in one call: properties, metadata, children, relationship counts, the views that include them, links and source location. Ids not found are listed in notFound instead of failing the call. Use read-element only when you also need relationships, deployedInstances, defaultView or project.`,
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
})(async (languageServices, args) => {
  invariant(args.ids.length <= MAX_IDS, `Maximum ${MAX_IDS} element ids per call`)

  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)
  const locate = mkLocate(languageServices, projectId)

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
      links: serializeLinks(element),
      sourceLocation: locate({ element: element.id }),
    })
  }

  return { elements, notFound }
})
