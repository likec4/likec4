// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { ElementModel, LikeC4ViewModel, RelationshipModel } from '@likec4/core/model'
import type { Link, RichTextOrEmpty } from '@likec4/core/types'

function richTextToPlain(rt: RichTextOrEmpty): string | null {
  if (rt.isEmpty) return null
  return rt.text
}

function formatLinks(links: ReadonlyArray<Link>): string[] {
  return links.map(link => link.title ? `  - [${link.title}](${link.url})` : `  - ${link.url}`)
}

function formatMetadata(metadata: Record<string, unknown>): string[] {
  const lines: string[] = []
  for (const [key, value] of Object.entries(metadata)) {
    if (Array.isArray(value)) {
      lines.push(`  - ${key}: ${value.join(', ')}`)
    } else {
      lines.push(`  - ${key}: ${String(value)}`)
    }
  }
  return lines
}

function buildProjectSection(viewModel: LikeC4ViewModel): string[] {
  const lines: string[] = []
  const project = viewModel.$model.project
  lines.push(`# Project: ${project.title ?? project.id}`)
  if (project.contactPerson) {
    lines.push(`- Contact: ${project.contactPerson}`)
  }
  if (project.metadata) {
    const entries = Object.entries(project.metadata).filter(([, v]) => v != null)
    if (entries.length > 0) {
      lines.push(`- Metadata:`)
      for (const [key, value] of entries) {
        lines.push(`  - ${key}: ${String(value)}`)
      }
    }
  }
  return lines
}

function buildViewSection(viewModel: LikeC4ViewModel): string[] {
  const lines: string[] = []
  lines.push(`\n## Current View`)
  lines.push(`- View: ${viewModel.title ?? viewModel.id}`)
  lines.push(`- Type: ${viewModel._type}`)
  const viewDescription = richTextToPlain(viewModel.description)
  if (viewDescription) {
    lines.push(`- Description: ${viewDescription}`)
  }
  const viewLinks = viewModel.links
  if (viewLinks.length > 0) {
    lines.push(`- Links:`)
    lines.push(...formatLinks(viewLinks))
  }
  return lines
}

function formatRelationship(rel: RelationshipModel): string {
  const lines: string[] = []
  let line = `  - ${rel.source.title} -> ${rel.target.title}`
  if (rel.title) line += `: "${rel.title}"`
  if (rel.technology) line += ` [${rel.technology}]`
  if (rel.hasMetadata()) {
    const entries = Object.entries(rel.getMetadata())
    if (entries.length > 0) {
      const metaParts = entries.map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(',') : v}`)
      line += ` {${metaParts.join('; ')}}`
    }
  }
  lines.push(line)
  const relLinks = rel.links
  if (relLinks.length > 0) {
    for (const link of relLinks) {
      lines.push(link.title ? `    - link: [${link.title}](${link.url})` : `    - link: ${link.url}`)
    }
  }
  return lines.join('\n')
}

/**
 * Build a plain-text context block describing an element and its relationships.
 * Used as the `{context}` variable in system prompts.
 */
export function buildElementContext(
  element: ElementModel,
  viewModel: LikeC4ViewModel,
): string {
  const lines: string[] = []

  lines.push(...buildProjectSection(viewModel))
  lines.push('')
  lines.push(`# Element: ${element.title}`)
  lines.push(`- FQN: ${element.id}`)
  lines.push(`- Kind: ${element.kind}`)
  if (element.technology) {
    lines.push(`- Technology: ${element.technology}`)
  }

  const description = richTextToPlain(element.description)
  if (description) {
    lines.push(`- Description: ${description}`)
  }

  const summary = element.hasSummary ? richTextToPlain(element.summary) : null
  if (summary) {
    lines.push(`- Summary: ${summary}`)
  }

  const tags = element.tags
  if (tags.length > 0) {
    lines.push(`- Tags: ${tags.join(', ')}`)
  }

  const elementLinks = element.links
  if (elementLinks.length > 0) {
    lines.push(`- Links:`)
    lines.push(...formatLinks(elementLinks))
  }

  if (element.hasMetadata()) {
    lines.push(`\n## Metadata`)
    lines.push(...formatMetadata(element.getMetadata()))
  }

  // Parent
  const parent = element.parent
  if (parent) {
    lines.push(`\n## Parent`)
    lines.push(`- ${parent.title} (${parent.kind})`)
  }

  // Children
  const children = element.children()
  if (children.size > 0) {
    lines.push(`\n## Children`)
    for (const child of children) {
      let childLine = `- ${child.title} (${child.kind})`
      if (child.technology) childLine += ` [${child.technology}]`
      lines.push(childLine)
    }
  }

  // Incoming relationships
  const incoming = [...element.incoming()]
  if (incoming.length > 0) {
    lines.push(`\n## Incoming Relationships`)
    for (const rel of incoming) {
      lines.push(formatRelationship(rel))
    }
  }

  // Outgoing relationships
  const outgoing = [...element.outgoing()]
  if (outgoing.length > 0) {
    lines.push(`\n## Outgoing Relationships`)
    for (const rel of outgoing) {
      lines.push(formatRelationship(rel))
    }
  }

  // Current view context
  lines.push(...buildViewSection(viewModel))

  // Other views
  const views = element.views()
  if (views.size > 1) {
    lines.push(`\n## Also Appears In Views`)
    for (const v of views) {
      if (v.id !== viewModel.id) {
        lines.push(`- ${v.title ?? v.id}`)
      }
    }
  }

  return lines.join('\n')
}

/**
 * Template variables extracted from element and view model.
 * Used for interpolating system prompts and suggested questions.
 */
export interface TemplateVariables {
  title: string
  kind: string
  technology: string
  parent: string
  tags: string
  view: string
  dependencies: string
  dependents: string
  /** Full context block (only used in system prompts) */
  context: string
}

/** Extract template variables from an element and view model for prompt interpolation. */
export function buildTemplateVariables(
  element: ElementModel,
  viewModel: LikeC4ViewModel,
): TemplateVariables {
  const incoming = [...element.incoming()]
  const outgoing = [...element.outgoing()]

  const dependencyTitles = [...new Set(outgoing.map(r => r.target.title))]
  const dependentTitles = [...new Set(incoming.map(r => r.source.title))]

  return {
    title: element.title,
    kind: element.kind,
    technology: element.technology ?? '',
    parent: element.parent?.title ?? '',
    tags: element.tags.join(', '),
    view: viewModel.title ?? viewModel.id,
    dependencies: dependencyTitles.join(', '),
    dependents: dependentTitles.join(', '),
    context: buildElementContext(element, viewModel),
  }
}

const TEMPLATE_VAR_RE = /\{(\w+)\}/g

function isTemplateKey(key: string, vars: TemplateVariables): key is keyof TemplateVariables {
  return key in vars
}

/**
 * Interpolate template variables into a string.
 * Returns the interpolated string, or null if any referenced variable is empty
 * (used by suggested questions to hide incomplete questions).
 */
export function interpolateTemplate(
  template: string,
  vars: TemplateVariables,
  opts: { hideIfEmpty: boolean },
): string | null {
  let hasEmpty = false
  const result = template.replace(TEMPLATE_VAR_RE, (match, key: string) => {
    if (isTemplateKey(key, vars)) {
      const value = vars[key]
      if (!value) hasEmpty = true
      return value
    }
    return match
  })
  if (opts.hideIfEmpty && hasEmpty) return null
  return result
}

export const defaultSystemPrompt =
  `You are an architecture assistant for a system modeled in LikeC4. You help users understand elements, relationships, and architecture decisions.

You have access to the following architecture context:

{context}

Guidelines:
- Answer questions about this element based on the context provided.
- If asked about something not in the context, say so honestly.
- Keep answers concise and focused on architecture.
- Use the element names, kinds, and technologies from the context.
- When discussing relationships, mention both source and target.
- You may suggest architecture improvements or flag potential concerns when relevant.
- You may include URLs, external links, and references when they are helpful.
- Format responses using Markdown (links, lists, code blocks, etc.).`

/** Build a system prompt by interpolating template variables into the prompt template. */
export function buildSystemPrompt(vars: TemplateVariables, customPrompt?: string): string {
  const template = customPrompt ?? defaultSystemPrompt
  return interpolateTemplate(template, vars, { hideIfEmpty: false }) ?? template
}
