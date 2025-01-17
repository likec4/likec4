import { deepEqual as eq } from 'fast-equals'
import { isDefined } from 'remeda'
import type { Base } from './types'

function _update<E extends Base.Edge>(current: E[], update: E[]): E[] {
  return update.map((next) => {
    const existing = current.find(n => n.id === next.id)
    if (existing && existing.type === next.type) {
      if (
        eq(existing.hidden ?? false, next.hidden ?? false)
        && eq(existing.source, next.source)
        && eq(existing.sourceHandle ?? null, next.sourceHandle ?? null)
        && eq(existing.target, next.target)
        && eq(existing.targetHandle ?? null, next.targetHandle ?? null)
        && eq(existing.data, next.data)
      ) {
        return existing
      }
      return {
        ...existing,
        ...next,
        data: {
          ...existing.data,
          ...next.data,
        },
      }
    }
    return next
  })
}

export function updateEdges<E extends Base.Edge>(current: E[], update: E[]): E[]
export function updateEdges<E extends Base.Edge>(update: E[]): (current: E[]) => E[]
export function updateEdges<E extends Base.Edge>(current: E[], update?: E[]) {
  if (isDefined(update)) {
    return _update(current, update)
  }
  update = current
  return (current: E[]) => _update(current, update)
}
