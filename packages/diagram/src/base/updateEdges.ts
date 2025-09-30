import { deepEqual as eq } from 'fast-equals'
import { isDefined, omit } from 'remeda'
import type { BaseEdge } from './types'

function _update<E extends BaseEdge>(current: E[], update: E[]): E[] {
  return update.map((next) => {
    const existing = current.find(n => n.id === next.id)
    if (existing && eq(existing.type, next.type)) {
      if (
        eq(existing.hidden ?? false, next.hidden ?? false)
        && eq(existing.source, next.source)
        && eq(existing.sourceHandle ?? null, next.sourceHandle ?? null)
        && eq(existing.target, next.target)
        && eq(existing.targetHandle ?? null, next.targetHandle ?? null)
        && eq(existing.zIndex ?? 0, next.zIndex ?? 0)
        && eq(existing.data, next.data)
      ) {
        return existing
      }
      return {
        ...omit(existing, ['hidden', 'zIndex']),
        ...next,
        data: next.data,
      }
    }
    return next
  })
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
