// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { LikeC4Model } from '../../model'
import type { AnyAux, aux, LayoutedElementView } from '../../types'
import { exact } from '../../types'
import { invariant } from '../../utils'
import { computeRelationshipsView } from './compute'
import { layoutRelationshipsView } from './layout'

export type RelationshipViewExportScope = 'global' | 'view'

export type RelationshipViewExportParams<M extends AnyAux> = {
  model: LikeC4Model<M>
  baseViewId: aux.ViewId<M>
  subjectId: aux.ElementId<M>
  scope: RelationshipViewExportScope
}

export function relationshipViewExportId<M extends AnyAux>(
  baseViewId: aux.ViewId<M>,
  subjectId: aux.ElementId<M>,
): aux.StrictViewId<aux.toLayouted<M>> {
  return `${baseViewId}-relationships-${subjectId}` as aux.StrictViewId<aux.toLayouted<M>>
}

export function computeRelationshipViewExport<M extends AnyAux>({
  model,
  baseViewId,
  subjectId,
  scope,
}: RelationshipViewExportParams<M>): LayoutedElementView<aux.toLayouted<M>> {
  const baseView = model.findView(baseViewId)
  invariant(baseView, `Base view ${baseViewId} not found`)

  const subject = model.element(subjectId)
  const relationships = computeRelationshipsView(subjectId, model, baseViewId, scope)
  const layouted = layoutRelationshipsView(
    relationships,
    scope === 'view' ? baseView : null,
  )

  return exact({
    _stage: 'layouted',
    _type: 'element',
    id: relationshipViewExportId(baseViewId, subjectId),
    title: `${baseView.titleOrId} relationships of ${subject.title}`,
    description: null,
    tags: [],
    links: null,
    hash: `${baseView.$view.hash}:relationships:${scope}:${subjectId}`,
    autoLayout: {
      direction: 'LR',
    },
    nodes: layouted.nodes,
    edges: layouted.edges,
    bounds: layouted.bounds,
  })
}
