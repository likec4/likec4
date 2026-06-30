// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

export { computeLikeC4Model, computeParsedModelData, computeView, unsafeComputeView } from './compute-view'
export type { ComputeViewResult } from './compute-view'
export { resolveRulesExtendedViews } from './utils/resolve-extended-views'
export { viewsWithReadableEdges, withReadableEdges } from './utils/with-readable-edges'

export type * from './projects-view/_types'
export { computeProjectsView } from './projects-view/compute'

export {
  computeRelationshipsView,
  computeRelationshipViewExport,
  layoutRelationshipsView,
  relationshipViewExportId,
  resolveRelationshipNodeStyle,
  treeFromElements,
} from './relationships-view'
export type {
  RelationshipsViewData,
  RelationshipViewExportParams,
  RelationshipViewExportScope,
} from './relationships-view'

export { AdhocView } from './adhoc-view/builder'
export { computeAdhocView } from './adhoc-view/compute'
export type {
  AdhocViewExcludePredicate,
  AdhocViewIncludePredicate,
  AdhocViewPredicate,
  ComputedAdhocView,
} from './adhoc-view/compute'
