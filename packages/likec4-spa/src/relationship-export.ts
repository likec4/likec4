// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { WebappExportFormat } from '@likec4/config'
import {
  type RelationshipViewExportParams,
  type RelationshipViewExportScope,
  computeRelationshipViewExport,
} from '@likec4/core/compute-view'
import type { LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import type { LikeC4Styles } from '@likec4/core/styles'
import type { AnyAux, aux, Fqn, LayoutedElementView, ProcessedView } from '@likec4/core/types'
import { z } from 'zod'

export type RelationshipSourceExportFormat = Extract<WebappExportFormat, 'dot' | 'd2' | 'mmd' | 'puml' | 'drawio'>

export type RelationshipExportViewModel = {
  readonly titleOrId: string
  readonly $view: ProcessedView
  readonly $model: LikeC4Model<any>
  readonly $styles: LikeC4Styles
}

export const relationshipExportSearchSchema = z.object({
  relationships: z.string()
    .nonempty()
    .optional()
    .catch(undefined)
    .transform(v => v as Fqn | undefined),
  relationshipScope: z.enum(['view', 'global'])
    .optional()
    .catch(undefined),
})

export type RelationshipExportSearch = z.infer<typeof relationshipExportSearchSchema>

export function normalizeRelationshipScope(
  scope: RelationshipViewExportScope | undefined,
): RelationshipViewExportScope {
  return scope ?? 'view'
}

export function relationshipExportFilename(
  baseViewId: string,
  subjectId: string,
  extension: string,
): string {
  return `${baseViewId}-relationships-${subjectId}.${extension}`
}

export function createRelationshipExportView<M extends AnyAux>(
  params: RelationshipViewExportParams<M>,
): LayoutedElementView<aux.toLayouted<M>> {
  return computeRelationshipViewExport({
    ...params,
    scope: normalizeRelationshipScope(params.scope),
  })
}

export function createRelationshipExportViewModel<M extends AnyAux>(
  model: LikeC4Model<M>,
  view: LayoutedElementView<aux.toLayouted<M>>,
): RelationshipExportViewModel {
  return {
    titleOrId: view.title ?? view.id,
    $view: view,
    $model: model,
    $styles: model.$styles,
  }
}

export async function generateRelationshipExportSource<M extends AnyAux>(
  format: RelationshipSourceExportFormat,
  params: RelationshipViewExportParams<M>,
): Promise<string> {
  const view = createRelationshipExportView(params)
  if (format === 'dot') {
    return generateRelationshipDotSource(view)
  }

  const viewmodel = createRelationshipExportViewModel(params.model, view)

  switch (format) {
    case 'd2': {
      const { generateD2 } = await import('@likec4/generators')
      return generateD2(viewmodel as unknown as LikeC4ViewModel<aux.Unknown>)
    }
    case 'mmd': {
      const { generateMermaid } = await import('@likec4/generators')
      return generateMermaid(viewmodel as unknown as LikeC4ViewModel<aux.Unknown>)
    }
    case 'puml': {
      const { generatePuml } = await import('@likec4/generators')
      return generatePuml(viewmodel as unknown as LikeC4ViewModel<aux.Unknown>)
    }
    case 'drawio': {
      const { generateDrawio } = await import('@likec4/generators')
      return generateDrawio(viewmodel)
    }
  }
}

export async function renderRelationshipDotSvg(dot: string): Promise<string> {
  const { Graphviz } = await import('@hpcc-js/wasm-graphviz')
  const graphviz = await Graphviz.load()
  return graphviz.layout(dot, 'svg')
}

export async function generateRelationshipDrawioEditUrl<M extends AnyAux>(
  params: RelationshipViewExportParams<M>,
): Promise<string> {
  const view = createRelationshipExportView(params)
  const viewmodel = createRelationshipExportViewModel(params.model, view)
  const { generateDrawio, generateDrawioEditUrl } = await import('@likec4/generators')
  return generateDrawioEditUrl(generateDrawio(viewmodel))
}

function generateRelationshipDotSource(view: LayoutedElementView<AnyAux>): string {
  const lines = [
    `digraph ${dotString(view.id)} {`,
    `  graph [rankdir=${dotString(view.autoLayout.direction)}];`,
    '  node [shape=box, style=rounded];',
  ]

  for (const node of view.nodes) {
    lines.push(`  ${dotString(node.id)} [label=${dotString(node.title)}];`)
  }
  for (const edge of view.edges) {
    lines.push(`  ${dotString(edge.source)} -> ${dotString(edge.target)} [label=${dotString(edge.label ?? '')}];`)
  }
  lines.push('}')
  return lines.join('\n')
}

function dotString(value: string): string {
  return JSON.stringify(value)
}
