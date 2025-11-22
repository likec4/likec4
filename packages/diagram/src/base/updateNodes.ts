import { getNodeDimensions } from '@xyflow/system'
import { deepEqual as eq } from 'fast-equals'
import { hasSubObject, isDefined, isShallowEqual, pickBy } from 'remeda'
import type { BaseNode } from './types'

const EMPTY_OBJ = {}

function _update<N extends BaseNode>(current: N[], updated: N[]): N[] {
  if (current === updated) {
    return current
  }

  updated = updated.map((update) => {
    const existing = current.find(n => n.id === update.id && n.type === update.type)

    if (!existing) {
      return update
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
    }

    const { width: existingWidth, height: existingHeight } = getNodeDimensions(existing)

    const haveHandles = Object.hasOwn(existing, 'handles') || Object.hasOwn(update, 'handles')
    const isSameHandles = !haveHandles || eq(existing.handles ?? [], update.handles ?? [])

    if (
      isSameData
      && isSameHandles
      && eq(existingWidth, update.width ?? update.initialWidth)
      && eq(existingHeight, update.height ?? update.initialHeight)
      && eq(existing.parentId ?? null, update.parentId ?? null)
      && eq(existing.hidden, update.hidden ?? existing.hidden)
      && eq(existing.selected, update.selected ?? existing.selected)
      && eq(existing.selectable, update.selectable ?? existing.selectable)
      && eq(existing.focusable, update.focusable ?? existing.focusable)
      && eq(existing.draggable, update.draggable ?? existing.draggable)
      && eq(existing.dragHandle, update.dragHandle)
      && eq(existing.className, update.className)
      && eq(existing.zIndex, update.zIndex ?? existing.zIndex)
      && eq(existing.position, update.position)
      && eq(existing.domAttributes ?? EMPTY_OBJ, update.domAttributes ?? EMPTY_OBJ)
      && eq(existing.style ?? EMPTY_OBJ, update.style ?? EMPTY_OBJ)
    ) {
      return existing
    }

    const handles = haveHandles && isSameHandles ? existing.handles : update.handles

    return {
      // Retain existing properties that are defined, except parentId
      ...pickBy(existing, (v, k) => isDefined(v) && k !== 'parentId'),
      // Retain measured dimensions from existing if present
      ...('measured' in existing && {
        measured: {
          width: update.width ?? update.initialWidth,
          height: update.height ?? update.initialHeight,
        },
      }),
      // Apply updates, omitting undefined values
      ...pickBy(update, isDefined) as unknown as N,
      // Force dimensions
      width: update.width ?? update.initialWidth,
      height: update.height ?? update.initialHeight,
      ...(handles && { handles }),
      data,
    } as N
  })
  return isShallowEqual(current, updated) ? current : updated
}

/**
 * Updates nodes by merging existing nodes with updated nodes based on their IDs.
 *
 * Can be used in two ways:
 * 1. By providing both current and updated node arrays:
 *    `const newNodes = updateNodes(currentNodes, updatedNodes);`
 * 2. By providing only the updated node array, returning a function that takes the current nodes:
 *    `const updater = updateNodes(updatedNodes);
 *     const newNodes = updater(currentNodes);`
 *
 * @param current - The current array of nodes.
 * @param update - The array of nodes with updates.
 * @returns The updated array of nodes.
 */
export function updateNodes<N extends BaseNode>(current: N[], update: N[]): N[]
export function updateNodes<N extends BaseNode>(update: N[]): (current: N[]) => N[]
export function updateNodes<N extends BaseNode>(current: N[], update?: N[]) {
  if (isDefined(update)) {
    return _update(current, update)
  }
  update = current
  return (existing: N[]) => _update(existing, update)
}
