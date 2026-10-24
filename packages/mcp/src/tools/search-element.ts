// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { DeploymentNodeModel, ElementModel } from '@likec4/core/model'
import type { AnyAux } from '@likec4/core/types'
import Fuse, { type Expression } from 'fuse.js'
import * as z from 'zod/v4'
import { likec4Tool, logger } from '../utils'
import { includedInViews, includedInViewsSchema } from './_common'

// Skips the first segment so an org name (github.com/acme/...) does not match every link,
// while a repo still matches from a monorepo subfolder link (acme/platform/tree/main/worker)
const linkPathSegments = (url: string) => {
  const path = URL.canParse(url) ? new URL(url).pathname : url
  return path.split('/').filter(Boolean).slice(1).map(s => s.replace(/\.git$/, ''))
}

const TEXT_KEYS = ['name', 'title', 'id', 'description', 'links'] as const

// Prefixed words become exact Fuse conditions, the rest fuzzy-match any text key.
// Words are AND-ed, so `kind:legacy #tag1 #tag2` and `kind:system checkout` both work.
const toQuery = (search: string): Expression => ({
  $and: search.split(/\s+/).filter(Boolean).flatMap((word): Expression[] => {
    switch (true) {
      case word.startsWith('kind:'):
        return [{ kind: `=${word.slice(5)}` }]
      case word.startsWith('shape:'):
        return [{ shape: `=${word.slice(6)}` }]
      case word.startsWith('meta:'):
        return [{ meta: `=${word.slice(5)}` }]
      case word.startsWith('#'):
        return [{ tags: `'${word.slice(1)}` }]
      default:
        // Same split as the Fuse tokenizer, so "store-front.web" is three words
        return (word.match(/[\p{L}\p{M}\p{N}_]+/gu) ?? []).map(w => ({ $or: TEXT_KEYS.map(key => ({ [key]: w })) }))
    }
  }),
})

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
      'Case-insensitive, space-separated words that must all match. "kind:<value>" or "shape:<value>" '
        + 'matches a kind or shape exactly, "meta:<key>" elements with that metadata key, "#<value>" tags '
        + 'containing the value; any other word fuzzy-matches name, title, id (FQN), description or a link '
        + 'path segment except the first. Example: "kind:container #public checkout".',
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

  const fuse = new Fuse(candidates, {
    useExtendedSearch: true,
    ignoreLocation: true,
    threshold: 0.2,
    keys: [
      { name: 'name', weight: 8, getFn: c => c.el.name },
      { name: 'title', weight: 4, getFn: c => c.el.title },
      { name: 'id', weight: 3, getFn: c => c.el.id },
      { name: 'description', weight: 1, getFn: c => c.el.description.text ?? '' },
      { name: 'links', weight: 1, getFn: c => c.el.links.flatMap(l => linkPathSegments(l.url)) },
      { name: 'kind', getFn: c => c.el.kind },
      { name: 'shape', getFn: c => c.el.shape },
      { name: 'tags', getFn: c => [...c.el.tags] },
      { name: 'meta', getFn: c => Object.keys(c.el.getMetadata()) },
    ],
  })
  const query = toQuery(args.search)
  logger.debug('search: {query}', { query })
  const matched = fuse.search(query).map(r => r.item)

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
