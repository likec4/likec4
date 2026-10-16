// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { DeploymentNodeModel, ElementModel } from '@likec4/core/model'
import type { AnyAux } from '@likec4/core/types'
import Fuse from 'fuse.js'
import * as z from 'zod/v4'
import { likec4Tool, logger } from '../utils'
import { includedInViews, includedInViewsSchema } from './_common'

// Skips the first segment so an org name (github.com/acme/...) does not match every link,
// while a repo still matches from a monorepo subfolder link (acme/platform/tree/main/worker)
const linkPathSegments = (url: string) => {
  const path = URL.canParse(url) ? new URL(url).pathname : url
  return path.split('/').filter(Boolean).slice(1).map(s => s.replace(/\.git$/, ''))
}

type Candidate =
  | { type: 'element'; project: string; el: ElementModel<AnyAux> }
  | { type: 'deployment-node'; project: string; el: DeploymentNodeModel<AnyAux> }

const searchResultSchema = z.array(
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('element'),
      project: z.string().describe('Project ID'),
      id: z.string().describe('Element ID (FQN)'),
      name: z.string().describe('Element name'),
      kind: z.string(),
      title: z.string(),
      description: z.string().nullable(),
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
      description: z.string().nullable(),
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
    `Search elements and deployment nodes across all projects by id, title, description, link, kind, shape, tag or metadata key. Returns the total number of matches and the first 20, ranked by relevance for plain-text searches. Pass the ids found to read-element or other tools.`,
  inputSchema: {
    search: z.string().min(2, 'Search must be at least 2 characters long').describe(
      'Case-insensitive. "kind:<value>" or "shape:<value>" matches a kind or shape exactly, '
        + '"meta:<key>" elements with that metadata key, "#<value>" tags containing the value; '
        + 'anything else fuzzy-matches id (FQN), title, description and link path segments except the first, '
        + 'with every word required to match.',
    ),
  },
  outputSchema: {
    total: z.number(),
    found: searchResultSchema,
  },
})(async (languageServices, args) => {
  const candidates: Candidate[] = []
  for (const project of languageServices.projects()) {
    try {
      const model = await languageServices.computedModel(project.id)
      for (const el of model.elements()) {
        if (!el.imported) {
          candidates.push({ type: 'element', project: project.id, el })
        }
      }
      for (const el of model.deployment.nodes()) {
        candidates.push({ type: 'deployment-node', project: project.id, el })
      }
    } catch (error) {
      logger.error(`Error searching in project ${project.id}:`, { error })
    }
  }

  const search = args.search.toLowerCase()
  let matched: Candidate[]
  switch (true) {
    case search.startsWith('kind:'): {
      const kind = search.slice(5)
      logger.debug('search by kind: {kind}', { kind })
      matched = candidates.filter(c => c.el.kind.toLowerCase() === kind)
      break
    }
    case search.startsWith('shape:'): {
      const shape = search.slice(6)
      logger.debug('search by shape: {shape}', { shape })
      matched = candidates.filter(c => c.el.shape.toLowerCase() === shape)
      break
    }
    case search.startsWith('meta:'): {
      const key = search.slice(5)
      logger.debug('search by metadata: {key}', { key })
      matched = candidates.filter(c => !!c.el.getMetadata(key))
      break
    }
    case search.startsWith('#'): {
      const tag = search.slice(1)
      logger.debug('search by tag: {tag}', { tag })
      matched = candidates.filter(c => c.el.tags.some(t => t.toLowerCase().includes(tag)))
      break
    }
    default: {
      logger.debug('fuzzy search: {search}', { search })
      const fuse = new Fuse(candidates, {
        useTokenSearch: true,
        // Every word must match, so adding a word narrows the results
        tokenMatch: 'all',
        threshold: 0.2,
        keys: [
          { name: 'id', weight: 3, getFn: c => c.el.id },
          { name: 'title', weight: 3, getFn: c => c.el.title },
          { name: 'description', weight: 1, getFn: c => c.el.description.text ?? '' },
          { name: 'links', weight: 1, getFn: c => c.el.links.flatMap(l => linkPathSegments(l.url)) },
        ],
      })
      matched = fuse.search(args.search).map(r => r.item)
    }
  }

  return {
    total: matched.length,
    found: matched.slice(0, 20).map(toResult),
  }
})

function toResult({ type, project, el }: Candidate): z.infer<typeof searchResultSchema>[number] {
  return {
    type,
    project,
    id: el.id,
    name: el.name,
    kind: el.kind,
    title: el.title,
    description: el.description.text,
    technology: el.technology,
    shape: el.shape,
    tags: [...el.tags],
    metadata: el.getMetadata(),
    includedInViews: includedInViews(el.views()),
  }
}
