import type { ViewChange } from '@likec4/core/types'
import { filter, isNot, last, omit } from 'remeda'
import type {
  ActorSystem,
} from 'xstate'
import { createViewChange } from '../likec4diagram/state/createViewChange'
import type { DiagramContext, DiagramMachineRef } from '../likec4diagram/state/machine'
import type { Types } from '../likec4diagram/types'
import { machine } from './editorActor.setup'

/**
 * Actually this is DiagramActorRef
 * But we can't use it here due to circular type inference
 */
const diagramActorRef = function(system: ActorSystem<any>): DiagramMachineRef {
  return system.get('diagram')!
}

/**
 * Actually this is DiagramActorRef
 * But we can't use it here due to circular type inference
 */
const getDiagramContext = function(system: ActorSystem<any>): DiagramContext {
  return system.get('diagram')!.getSnapshot().context
}

export const raiseSync = () => machine.raise({ type: 'sync' }, { delay: 200, id: 'sync' })
export const cancelSync = () => machine.cancel('sync')

export const reschedule = (delay = 350) => machine.raise(({ event }) => event, { delay })

type LayoutChanges = ViewChange.ResetManualLayout | ViewChange.SaveViewSnapshot
export const isLayoutChange = (
  change: ViewChange,
): change is LayoutChanges => change.op === 'reset-manual-layout' || change.op === 'save-view-snapshot'

export const withoutSnapshotChanges = filter<ViewChange[], Exclude<ViewChange, LayoutChanges>>(isNot(isLayoutChange))

export const saveStateBeforeEdit = () =>
  machine.assign(({ system }) => {
    const parentContext = getDiagramContext(system)
    return {
      beforeEditing: {
        xynodes: parentContext.xynodes.map(({ measured, ...n }) =>
          ({
            ...omit(n, ['selected', 'dragging', 'resizing']),
            data: omit(n.data, ['dimmed', 'hovered']),
            measured,
            initialWidth: measured?.width ?? n.width ?? n.initialWidth,
            initialHeight: measured?.height ?? n.height ?? n.initialHeight,
          }) as Types.Node
        ),
        xyedges: parentContext.xyedges.map(e =>
          ({
            ...omit(e, ['selected']),
            data: omit(e.data, ['active', 'dimmed', 'hovered']),
          }) as Types.Edge
        ),
        change: createViewChange(parentContext),
        view: parentContext.view,
        synched: false,
      },
    }
  })

export const startEditing = () =>
  machine.enqueueActions(({ enqueue, event }) => {
    enqueue(saveStateBeforeEdit())
    if (event.type === 'edit.start') {
      enqueue.assign({
        editing: event.subject,
      })
    }
  })

export const stopHotkey = () => machine.stopChild('hotkey')

export const ensureHotKey = () =>
  machine.enqueueActions(({ check, enqueue, self }) => {
    const hasUndo = check('can undo')
    const hotkey = self.getSnapshot().children['hotkey']
    if (!hasUndo && hotkey) {
      enqueue.stopChild(hotkey)
      return
    }
    if (hasUndo && !hotkey) {
      enqueue.spawnChild('hotkey', {
        id: 'hotkey',
      })
    }
  })

export const pushHistory = () =>
  machine.assign(({ context }) => {
    const snapshot = context.beforeEditing
    if (!snapshot) {
      // If we have beforeEditing snapshot, do not push history
      return {
        editing: null,
      }
    }

    return {
      beforeEditing: null,
      editing: null,
      history: [
        ...context.history,
        snapshot,
      ],
    }
  })

export const stopEditing = () =>
  machine.enqueueActions(({ event, enqueue }) => {
    if (event.type === 'edit.finish' && event.wasChanged) {
      enqueue(pushHistory())
      enqueue(raiseSync())
      return
    }

    enqueue.assign({
      beforeEditing: null,
      editing: null,
    })
  })

export const markHistoryAsSynched = () =>
  machine.assign(({ context }) => {
    return {
      beforeEditing: context.beforeEditing && context.beforeEditing.synched === false
        ? {
          ...context.beforeEditing,
          synched: true,
        }
        : context.beforeEditing,
      history: context.history.map(i => ({
        ...i,
        synched: true,
      })),
    }
  })

export const popHistory = () =>
  machine.assign(({ context }) => {
    if (context.history.length <= 1) {
      return {
        history: [],
      }
    }
    return {
      history: context.history.slice(0, context.history.length - 1),
    }
  })

export const undo = () =>
  machine.enqueueActions(({ context, enqueue, system }) => {
    const lastHistoryItem = last(context.history)
    if (!lastHistoryItem) {
      return
    }
    if (import.meta.env.DEV) {
      console.log('undo')
    }
    enqueue(cancelSync())
    enqueue(popHistory())
    enqueue(ensureHotKey())
    const diagramActor = diagramActorRef(system)

    enqueue.sendTo(diagramActor, {
      type: 'update.view',
      view: lastHistoryItem.view,
      xyedges: lastHistoryItem.xyedges,
      xynodes: lastHistoryItem.xynodes,
      source: 'editor',
    })

    enqueue.assign({
      pendingChanges: [],
    })

    // If the last history item was already synched,
    // we need to emit change event
    if (lastHistoryItem.synched) {
      enqueue.raise({ type: 'change', change: lastHistoryItem.change }, { delay: 50 })
    } else {
      // Otherwise, we need to start sync after undo
      enqueue(raiseSync())
    }
  })

export const addSnapshotToPendingChanges = () =>
  machine.assign(({ context, system }) => {
    const parentContext = getDiagramContext(system)
    const change = createViewChange(parentContext)

    return {
      pendingChanges: [
        // Remove all save-view-snapshot and reset-manual-layout changes
        ...withoutSnapshotChanges(context.pendingChanges),
        change,
      ],
    }
  })
