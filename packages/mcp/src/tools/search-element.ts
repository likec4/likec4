// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { ifilter } from '@likec4/core/utils'
import * as z from 'zod/v4'
import { likec4Tool, logger } from '../utils'
import { includedInViews, includedInViewsSchema } from './_common'

const searchResultSchema = z.array(
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('element'),
      project: z.string().describe('Project ID'),
      id: z.string().describe('Element ID (FQN)'),
      name: z.string().describe('Element name'),
      kind: z.string(),
      title: z.string(),
      technology: z.string().nullable(),
      shape: z.string(),
      includedInViews: includedInViewsSchema,
      metadata: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
      tags: z.array(z.string()),
    }),
    z.object({
      type: z.literal('deployment-node'),
      project: z.string().describe('Project ID'),
      id: z.string().describe('Deployment ID (FQN)'),
      name: z.string().describe('Deployment name'),
      kind: z.string(),
      title: z.string(),
      technology: z.string().nullable(),
      shape: z.string(),
      includedInViews: includedInViewsSchema,
      metadata: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
      tags: z.array(z.string()),
    }),
  ]),
)

export const searchElement = likec4Tool({
  name: 'search-element',
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Search elements',
  },
  description:
    `Search elements and deployment nodes across all projects by id, title, kind, shape, tag or metadata key. Returns the total number of matches and the first 20. Pass the ids found to read-element or other tools.`,
  inputSchema: {
    search: z.string().min(2, 'Search must be at least 2 characters long').describe(
      'Case-insensitive. "kind:<value>" or "shape:<value>" matches a kind or shape exactly, '
        + '"meta:<key>" elements with that metadata key, "#<value>" tags containing the value; '
        + 'anything else matches id (FQN) or title.',
    ),
  },
  outputSchema: {
    total: z.number(),
    found: searchResultSchema,
  },
})(async (languageServices, args) => {
  const projects = languageServices.projects()
  const found = [] as z.infer<typeof searchResultSchema>
  let search = args.search.toLowerCase()

  let predicate: <
    E extends {
      id: string
      title: string
      kind: string
      shape: string
      tags: readonly string[]
      getMetadata: (key: string) => string | string[] | undefined
    },
  >(
    el: E,
  ) => boolean

  if (search.startsWith('kind:')) {
    search = search.slice(5)
    logger.debug('search by kind: {search}', { search })
    predicate = (el) => el.kind.toLowerCase() === search
  } else if (search.startsWith('shape:')) {
    search = search.slice(6)
    logger.debug('search by shape: {search}', { search })
    predicate = (el) => el.shape.toLowerCase() === search
  } else if (search.startsWith('meta:')) {
    search = search.slice(5)
    logger.debug('search by metadata: {search}', { search })
    predicate = (el) => !!el.getMetadata(search)
  } else if (search.startsWith('#')) {
    search = search.slice(1)
    logger.debug('search by tag: {search}', { search })
    predicate = (el) => el.tags.some(tag => tag.toLowerCase().includes(search))
  } else {
    logger.debug('search by id/title: {search}', { search })
    predicate = (el) =>
      el.id.toLowerCase().includes(search)
      || el.title.toLowerCase().includes(search)
  }

  for (const project of projects) {
    try {
      const model = await languageServices.computedModel(project.id)

      // filter elements
      for (const el of ifilter(model.elements(), e => !e.imported && predicate(e))) {
        found.push({
          type: 'element',
          project: project.id,
          id: el.id,
          name: el.name,
          kind: el.kind,
          title: el.title,
          technology: el.technology,
          shape: el.shape,
          tags: [...el.tags],
          metadata: el.getMetadata(),
          includedInViews: includedInViews(el.views()),
        })
      }

      // filter deployment nodes
      for (const el of ifilter(model.deployment.nodes(), predicate)) {
        found.push({
          type: 'deployment-node',
          project: project.id,
          id: el.id,
          name: el.name,
          kind: el.kind,
          title: el.title,
          technology: el.technology,
          shape: el.shape,
          tags: [...el.tags],
          metadata: el.getMetadata(),
          includedInViews: includedInViews(el.views()),
        })
      }
    } catch (error) {
      logger.error(`Error searching in project ${project.id}:`, { error })
    }
  }

  return {
    total: found.length,
    found: found.slice(0, 20),
  }
})
