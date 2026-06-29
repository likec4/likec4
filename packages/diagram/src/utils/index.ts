// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

export { Vector, vector } from '@likec4/core/geometry'
export type { VectorValue } from '@likec4/core/geometry'
export {
  bezierControlPoints,
  bezierPath,
  distance,
  distanceBetweenPoints,
  extractMinimalInternalNode,
  getNodeCenter,
  getNodeIntersection,
  getNodeIntersectionFromCenterToPoint,
  isEqualMinimalInternalNodes,
  isInside,
  isSamePoint,
  type MinimalInternalNode,
  nodeToRect,
  stopPropagation,
} from './xyflow'

export { readableText } from './readableText'
export { roundDpr } from './roundDpr'
export { pickViewBounds } from './view-bounds'
