import { deepEqual as eq } from 'fast-equals'
import { hasSubObject, isDefined, isShallowEqual, pickBy } from 'remeda'
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
      if (isDefined(existing.data.hovered) && !isDefined(update.data.hovered)) {
        data = {
          ...data,
          hovered: existing.data.hovered,
        }
      }
      if (isDefined(existing.data.dimmed) && !isDefined(update.data.dimmed)) {
        data = {
          ...data,
          dimmed: existing.data.dimmed,
        }
      }
      if (isDefined(existing.data.active) && !isDefined(update.data.active)) {
        data = {
          ...data,
          active: existing.data.active,
        }
      }
    }

    if (
      isSameData
      && eq(existing.hidden, update.hidden ?? existing.hidden)
      && eq(existing.selected, update.selected ?? existing.selected)
      && eq(existing.selectable, update.selectable ?? existing.selectable)
      && eq(existing.focusable, update.focusable ?? existing.focusable)
      && eq(existing.animated, update.animated ?? existing.animated)
      && eq(existing.className, update.className)
      && eq(existing.zIndex, update.zIndex ?? existing.zIndex)
      && eq(existing.label, update.label)
      && eq(existing.sourceHandle, update.sourceHandle)
      && eq(existing.targetHandle, update.targetHandle)
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
