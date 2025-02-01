import { getNodeDimensions } from '@xyflow/system'
import { deepEqual as eq } from 'fast-equals'
import { isDefined, omit } from 'remeda'
import type { Base } from './types'

function _update<N extends Base.Node>(current: N[], updated: N[]): N[] {
  return updated.map((update) => {
    const existing = current.find(n => n.id === update.id)
    if (existing) {
      const { width: existingWidth, height: existingHeight } = getNodeDimensions(existing)
      if (
        eq(existing.type, update.type)
        && eq(existingWidth, update.initialWidth)
        && eq(existingHeight, update.initialHeight)
        && eq(existing.parentId ?? null, update.parentId ?? null)
        && eq(existing.hidden ?? false, update.hidden ?? false)
        && eq(existing.zIndex ?? 0, update.zIndex ?? 0)
        && eq(existing.position, update.position)
        && eq(existing.data, update.data)
      ) {
        return existing
      }
      return {
        ...omit(existing, ['measured', 'parentId', 'hidden', 'zIndex']),
        ...update,
        // Force dimensions from update
        width: update.initialWidth,
        height: update.initialHeight,
        data: {
          ...existing.data,
          ...update.data,
        },
      } as N
    }
    return update
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
