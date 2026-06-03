import type * as t from '@likec4/core/types'
import { filter, isNot, omit } from 'remeda'
import { type ActorSystem, assertEvent } from 'xstate'
import { createViewChange } from '../../likec4diagram/state/createViewChange'
import type { DiagramContext } from '../../likec4diagram/state/types'
import { typedSystem } from '../../likec4diagram/state/utils'
import type { Types } from '../../likec4diagram/types'
import { machine } from './setup'
import type { Snapshot, SyncOp } from './types'

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

export const isLayoutChangeOp = <T extends SyncOp>(
  op: T,
): op is Extract<T, string | LayoutChanges> =>
  op === 'apply-latest-to-manual' || op === 'apply-semantic-layout' || op === 'sync-snapshot' || isLayoutChange(op)

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
export const saveBeforeEditing = () =>
  machine.assign(({ system, event }) => {
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
  machine.enqueueActions(({ context, enqueue }) => {
    const editing = context.editing
    if (import.meta.env.DEV) {
      console.log('pushHistory', editing)
    }
    if (editing) {
      enqueue.assign({
        editing: null,
        history: {
          head: editing.before,
          tail: context.history,
        },
        redo: null,
      })
      enqueue(scheduleSync())
    }
  })

export const reschedule = (delay = 300) =>
  machine.raise(({ event }) => {
    if (import.meta.env.DEV) {
      console.log('reschedule', event)
    }
    return { ...event }
  }, { delay })

export const undo = () =>
  machine.enqueueActions(({ context: { history, redo }, system, enqueue }) => {
    if (!history) {
      return
    }

    const last = history.head

    enqueue.assign({
      history: history.tail,
      redo: {
        head: makeSnapshot(system),
        tail: redo,
      },
    })
    enqueue(cancelSync())
    enqueue(scheduleSync(100))
    enqueue.sendTo(typedSystem.diagramActor, {
      type: 'update.view',
      view: last.view,
      xyedges: last.xyedges,
      xynodes: last.xynodes,
      source: 'editor',
    })
  })

export const redo = () =>
  machine.enqueueActions(({ context: { history, redo }, system, enqueue }) => {
    if (!redo) {
      return
    }

    const last = redo.head

    enqueue.assign({
      history: {
        head: makeSnapshot(system),
        tail: history,
      },
      redo: redo.tail,
    })
    enqueue(cancelSync())
    enqueue(scheduleSync(100))
    enqueue.sendTo(typedSystem.diagramActor, {
      type: 'update.view',
      view: last.view,
      xyedges: last.xyedges,
      xynodes: last.xynodes,
      source: 'editor',
    })
  })

export const deleteNodesAndEdges = () =>
  machine.enqueueActions(({ context, system, event, enqueue }) => {
    assertEvent(event, 'delete.nodes-edges')
    if (import.meta.env.DEV) {
      console.log('deleteNodesAndEdges', { history: context.history, event })
    }
    // xyflow already cascades deletion to child nodes, so event.nodeIds is complete
    const deletedNodeIds = new Set(event.nodeIds)
    const willNotBeDeletedNode = (node: t.NodeId | t.DiagramNode) =>
      !deletedNodeIds.has(typeof node === 'string' ? node : node.id)
    const snapshot = makeSnapshot(system)

    // Explicitly deleted edges, plus any edge incident to a deleted node
    const deletedEdgeIds = new Set(event.edgeIds)
    for (const edge of snapshot.view.edges) {
      if (deletedNodeIds.has(edge.source) || deletedNodeIds.has(edge.target)) {
        deletedEdgeIds.add(edge.id)
      }
    }
    const willNotBeDeletedEdge = (edge: t.EdgeId | t.DiagramEdge) =>
      !deletedEdgeIds.has(typeof edge === 'string' ? edge : edge.id)

    enqueue.assign({
      history: {
        head: snapshot,
        tail: context.history,
      },
      redo: null,
    })

    const cleanupNode = <N extends t.DiagramNode>(node: N): N => {
      if (
        node.children.every(willNotBeDeletedNode)
        && node.inEdges.every(willNotBeDeletedEdge)
        && node.outEdges.every(willNotBeDeletedEdge)
      ) {
        return node
      }
      return {
        ...node,
        children: node.children.filter(willNotBeDeletedNode),
        inEdges: node.inEdges.filter(willNotBeDeletedEdge),
        outEdges: node.outEdges.filter(willNotBeDeletedEdge),
      }
    }

    enqueue(cancelSync())
    enqueue(scheduleSync())
    enqueue.sendTo(typedSystem.diagramActor, {
      type: 'update.view',
      view: {
        ...snapshot.view,
        nodes: snapshot.view.nodes.filter(willNotBeDeletedNode).map(cleanupNode),
        edges: snapshot.view.edges.filter(willNotBeDeletedEdge),
      },
      source: 'editor',
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
        nextOp = 'apply-latest-to-manual'
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
    if (syncQueue.length === 1 && syncQueue[0] === nextOp) {
      if (import.meta.env.DEV) {
        console.log('syncQueue has only one item and it is the same, not changing', { nextOp })
      }
      return {}
    }

    const isNextLayoutChange = isLayoutChangeOp(nextOp)
    let pending = syncQueue.filter(existingOp => {
      if (existingOp === nextOp) {
        return false
      }
      if (isNextLayoutChange && isLayoutChangeOp(existingOp)) {
        // Keep the latest view change, drop the previous one
        return false
      }
      // Otherwise keep the operation
      return true
    })
    const newQueue = pending.length > 0 ? [...pending, nextOp] : [nextOp]
    if (import.meta.env.DEV) {
      console.log('new sync queue', { syncQueue, nextOp, newQueue })
    }
    return {
      syncQueue: newQueue,
    }
  })

export const clearQueue = () =>
  machine.assign({
    syncQueue: [],
    processing: null,
  })
