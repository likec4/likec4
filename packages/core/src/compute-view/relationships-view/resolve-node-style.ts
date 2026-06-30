// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { omit } from 'remeda'
import type { ElementModel, LikeC4ViewModel } from '../../model'
import type { AnyAux, Color, ElementShape, ElementStyle, IconUrl } from '../../types'
import { ifind } from '../../utils'

export type ResolvedRelationshipNodeStyle<M extends AnyAux> = {
  existsInCurrentView: boolean
  color: Color
  icon: IconUrl | null
  shape: ElementShape
  style: Omit<ElementStyle, 'color' | 'shape' | 'icon'>
  inheritedNode: ReturnType<LikeC4ViewModel<M>['findNodeWithElement']>
}

export function resolveRelationshipNodeStyle<M extends AnyAux>(
  scope: LikeC4ViewModel<M> | null,
  element: ElementModel<M>,
): ResolvedRelationshipNodeStyle<M> {
  const scopedNode = scope?.findNodeWithElement(element.id) ?? null
  const scopedAncestor = scope && !scopedNode
    ? ifind(element.ancestors(), ancestor => !!scope.findNodeWithElement(ancestor.id)) ?? null
    : null
  const scopedAncestorNode = scopedAncestor ? scope?.findNodeWithElement(scopedAncestor.id) ?? null : null
  const inheritedNode = scopedNode ?? scopedAncestorNode

  const inheritedStyle = scopedNode
    ? { ...element.style, ...scopedNode.style }
    : { ...element.style, ...scopedAncestorNode?.style, ...element.$element.style }

  return {
    existsInCurrentView: !!scopedNode,
    color: scopedNode
      ? scopedNode.color
      : element.$element.style.color ?? scopedAncestorNode?.color ?? element.color,
    icon: scopedNode
      ? scopedNode.icon
      : element.$element.style.icon ?? scopedAncestorNode?.icon ?? element.icon,
    shape: scopedNode
      ? scopedNode.shape
      : element.$element.style.shape ?? scopedAncestorNode?.shape ?? element.shape,
    style: omit(inheritedStyle, ['color', 'shape', 'icon']),
    inheritedNode,
  }
}
