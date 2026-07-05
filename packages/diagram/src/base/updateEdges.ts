// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { deepEqual as eq } from 'fast-equals'
import { isDefined, isShallowEqual, pickBy } from 'remeda'
import { hasSubObject } from './Base'
import type { BaseEdge } from './types'

const EMPTY_OBJ = {}

function _update<E extends BaseEdge>(current: E[], updated: E[]): E[] {
  if (current === updated) {
    return current
  }
  updated = updated.map((update): E => {
    const existing = current.find(n =>
      n.id === update.id &&
      n.type === update.type &&
      n.source === update.source &&
      n.target === update.target
    )

    if (!existing) {
      return update
    }
    if (existing === update) {
      return existing
    }

    const isSameData = hasSubObject(existing.data, update.data)
    let data = isSameData ? existing.data : update.data
    if (!isSameData) {
      // Preserve hovered and dimmed states if not specified in update
      if (isDefined(existing.data.hovered) && !isDefined(data.hovered)) {
        data = Object.assign({ hovered: existing.data.hovered }, data)
      }
      if (isDefined(existing.data.dimmed) && !isDefined(data.dimmed)) {
        data = Object.assign({ dimmed: existing.data.dimmed }, data)
      }
      if (isDefined(existing.data.active) && !isDefined(data.active)) {
        data = Object.assign({ active: existing.data.active }, data)
      }
    } else if (
      eq(existing.hidden, update.hidden ?? existing.hidden)
      && eq(existing.selected, update.selected ?? existing.selected)
      && eq(existing.selectable, update.selectable ?? existing.selectable)
      && eq(existing.animated, update.animated ?? existing.animated)
      && eq(existing.ariaLabel, update.ariaLabel ?? existing.ariaLabel)
      && eq(existing.ariaRole, update.ariaRole ?? existing.ariaRole)
      && eq(existing.className, update.className ?? existing.className)
      && eq(existing.zIndex, update.zIndex ?? existing.zIndex)
      && eq(existing.label, update.label)
      && eq(existing.sourceHandle, update.sourceHandle ?? existing.sourceHandle)
      && eq(existing.targetHandle, update.targetHandle ?? existing.targetHandle)
      && eq(existing.style ?? EMPTY_OBJ, update.style ?? EMPTY_OBJ)
    ) {
      return existing
    }

    return {
      // Retain existing properties that are defined, except parentId
      ...pickBy(existing, isDefined) as unknown as E,
      // Apply updates, omitting undefined values
      ...pickBy(update, isDefined) as unknown as E,
      data,
    } as E
  })

  return isShallowEqual(current, updated) ? current : updated
}

export function updateEdges<E extends BaseEdge>(current: E[], update: E[]): E[]
export function updateEdges<E extends BaseEdge>(update: E[]): (current: E[]) => E[]
export function updateEdges<E extends BaseEdge>(current: E[], update?: E[]) {
  if (isDefined(update)) {
    return _update(current, update)
  }
  update = current
  return (current: E[]) => _update(current, update)
}
