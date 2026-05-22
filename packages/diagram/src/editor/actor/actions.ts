import type * as t from '@likec4/core/types'
import { filter, isNot, omit } from 'remeda'
import { type ActorSystem, assertEvent } from 'xstate'
import { createViewChange } from '../../likec4diagram/state/createViewChange'
import type { DiagramMachineRef } from '../../likec4diagram/state/machine'
import type { DiagramContext } from '../../likec4diagram/state/types'
import { typedSystem } from '../../likec4diagram/state/utils'
import type { Types } from '../../likec4diagram/types'
import { machine } from './setup'
import { type Snapshot, type SyncOp, isViewChange } from './types'

/**
 * Actually this is DiagramActorRef
 * But we can't use it here due to circular type inference
 */
export const diagramActorRef = (system: ActorSystem<any>): DiagramMachineRef => {
  return system.get('diagram')!
}

/**
 * Actually this is DiagramActorRef
 * But we can't use it here due to circular type inference
 */
const getDiagramContext = function(system: ActorSystem<any>): DiagramContext {
  return system.get('diagram')!.getSnapshot().context
}
export function makeSnapshot(system: ActorSystem<any>): Snapshot {
  const parentContext = getDiagramContext(system)
  return {
    xynodes: parentContext.xynodes.map(({ measured, data, ...n }) => (({
      ...omit(n, ['selected', 'dragging', 'resizing']),
      data: omit(data, ['dimmed', 'hovered']),
      measured,
      initialWidth: measured?.width ?? n.width ?? n.initialWidth,
      initialHeight: measured?.height ?? n.height ?? n.initialHeight,
    }) as Types.Node)),
    xyedges: parentContext.xyedges.map(({ data, ...e }) => (({
      ...omit(e, ['selected']),
      data: omit(data, ['active', 'dimmed', 'hovered']),
    }) as Types.Edge)),
    change: createViewChange(parentContext),
    view: parentContext.view,
  }
}

type LayoutChanges = t.ViewChange.ResetManualLayout | t.ViewChange.SaveViewSnapshot
export const isLayoutChange = (
  change: t.ViewChange,
): change is LayoutChanges => change.op === 'reset-manual-layout' || change.op === 'save-view-snapshot'

export const withoutSnapshotChanges = filter<t.ViewChange[], Exclude<t.ViewChange, LayoutChanges>>(
  isNot(isLayoutChange),
)

export const scheduleSync = (delay = 50) => {
  return machine.raise({
    type: 'change.sync-snapshot',
  }, delay ? { delay, id: 'sync-snapshot' } : undefined)
}
export const cancelSync = () => {
  return machine.cancel('sync-snapshot')
}

/**
 * Save the state before editing starts
 */
export const saveBeforeEditing = machine.assign(({ system, event }) => {
  assertEvent(event, 'edit.move.start')
  if (import.meta.env.DEV) {
    console.log('saveBeforeEditing', event)
  }
  return {
    editing: {
      subject: event.subject,
      before: makeSnapshot(system),
    },
  }
})

/**
 * When editing finishes, push the "beforeEditing" state to the history stack
 */
export const pushHistory = () =>
  machine.assign(({ context }) => {
    const editing = context.editing
    if (import.meta.env.DEV) {
      console.log('pushHistory', editing)
    }
    if (editing) {
      return {
        editing: null,
        history: {
          head: editing.before,
          tail: context.history,
        },
      }
    }
    return {}
  })

export const reschedule = (delay = 300) => machine.raise(({ event }) => ({ ...event }), { delay })

export const undo = () =>
  machine.enqueueActions(({ context: { history }, enqueue }) => {
    if (import.meta.env.DEV) {
      console.log('undo', { history })
    }
    if (!history) {
      return
    }

    const last = history.head

    enqueue.assign({
      history: history.tail,
    })
    enqueue.sendTo(typedSystem.diagramActor, {
      type: 'update.view',
      view: last.view,
      xyedges: last.xyedges,
      xynodes: last.xynodes,
      source: 'editor',
    })
    enqueue.cancel('undo-view')
    enqueue.raise({
      type: 'change.view',
      change: last.change,
    }, {
      delay: 200,
      id: 'undo-view',
    })
  })

export const pushToSyncQueue = () =>
  machine.assign(({ context: { syncQueue }, event }) => {
    let nextOp: SyncOp
    switch (event.type) {
      case 'change.view':
        nextOp = event.change
        break
      case 'change.semantic-layout':
        nextOp = 'apply-semantic-layout'
        break
      case 'change.latest-to-manual':
        nextOp = 'apply-semantic-layout'
        break
      case 'change.sync-snapshot':
        nextOp = 'sync-snapshot'
        break
      default:
        throw new Error(`Invalid event type: ${event.type}`)
    }

    if (syncQueue.length === 0) {
      if (import.meta.env.DEV) {
        console.log('syncQueue is empty, adding', { nextOp })
      }
      return {
        syncQueue: [nextOp],
      }
    }
    const isNextLayoutChange = isViewChange(nextOp) && isLayoutChange(nextOp)
    let pending = syncQueue.filter(existingOp => {
      if (existingOp === nextOp) {
        return false
      }
      if (isNextLayoutChange && isViewChange(existingOp) && isLayoutChange(existingOp)) {
        // Keep the latest view change, drop the previous one
        return false
      }
      // Otherwise keep the operation
      return true
    })
    if (import.meta.env.DEV) {
      console.log('syncQueue is not empty, adding', { syncQueue, pending, nextOp })
    }
    return {
      syncQueue: pending.length > 0 ? [...pending, nextOp] : [nextOp],
    }
  })

export const clearQueue = () =>
  machine.assign({
    syncQueue: [],
    processing: null,
  })
