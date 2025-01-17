import { deepEqual as eq } from 'fast-equals'
import { isDefined } from 'remeda'
import type { Base } from './types'

function _update<N extends Base.Node>(current: N[], update: N[]): N[] {
  return update.map((next) => {
    const existing = current.find(n => n.id === next.id)
    if (
      existing
      && existing.type === next.type
      && eq(existing.parentId ?? null, next.parentId ?? null)
    ) {
      if (
        eq(existing.style, next.style)
        && eq(existing.hidden ?? false, next.hidden ?? false)
        && eq(existing.position, next.position)
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
      } as N
    }
    return next
  })
}

export function updateNodes<N extends Base.Node>(current: N[], update: N[]): N[]
export function updateNodes<N extends Base.Node>(update: N[]): (current: N[]) => N[]
export function updateNodes<N extends Base.Node>(current: N[], update?: N[]) {
  if (isDefined(update)) {
    return _update(current, update)
  }
  update = current
  return (current: N[]) => _update(current, update)
}
