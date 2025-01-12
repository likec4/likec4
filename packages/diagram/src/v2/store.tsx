import type { DiagramView, WhereOperator } from '@likec4/core'
import type { Input } from '@mantine/core'
import { useCallbackRef } from '@mantine/hooks'
import { createBrowserInspector } from '@statelyai/inspect'
import { createActorContext } from '@xstate/react'
import { fromStore } from '@xstate/store'
import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react'
import type { EdgeChange, NodeChange } from '@xyflow/system'
import { DEV } from 'esm-env'
import { shallowEqual } from 'fast-equals'
import { type PropsWithChildren, useCallback } from 'react'
import { values } from 'remeda'
import { type EventFromLogic } from 'xstate'
import { useUpdateEffect } from '../hooks'
import { updateView } from './actions/updateView'
import { diagramViewToXYFlowData } from './diagram-to-xyflow'
import type { Types } from './types'

let inspector: any = null
if (DEV) {
  inspector = createBrowserInspector({
    autoStart: true,
    filter: (event) => {
      return event.type !== '@xstate.event' || event.event.type !== 'applyNodeChanges'
      // return !event.
    },
  })
}

type Input = {
  view: DiagramView
  zoomable: boolean
  pannable: boolean
  nodesDraggable: boolean
  nodesSelectable: boolean
  whereFilter: WhereOperator<string, string> | null
  enableElementDetails: boolean
  enableRelationshipBrowser: boolean
  hasNavigateTo: boolean
  fitViewPadding: number
}

export type Context = Readonly<
  Input & {
    xynodes: Types.Node[]
    xyedges: Types.Edge[]
    initialized: boolean
    viewportChangedManually: boolean
  }
>

export type StoreSnapshot = {
  context: Context
}

const storeLogic = fromStore({
  // Initial context
  context: (input: Input): Context => ({
    ...input,
    ...diagramViewToXYFlowData(input.view, input),
    initialized: false,
    viewportChangedManually: false,
  }),
  types: {
    emitted: {} as { type: 'changed-view'; viewId: string },
    // | { type: 'initialized' },
  },
  // Transitions
  on: {
    onInit: {
      initialized: true,
    },
    onNodeClick: (_context, _event: { node: Types.Node }) => {
      return _context
    },
    onEdgeClick: (_context, _event: { edge: Types.Edge }) => {
      return _context
    },
    updateView: (context, event: { view: DiagramView }, { emit }) => {
      const next = updateView(context, event)
      if (next.view.id !== context.view.id) {
        emit({ type: 'changed-view', viewId: next.view.id })
      }
      return next
    },
    updateInputs: (context, event: { inputs: Partial<Omit<Input, 'view'>> }) => {
      return {
        ...context,
        ...event.inputs,
      }
    },
    applyNodeChanges: {
      xynodes: ({ xynodes }, event: { changes: NodeChange<Types.Node>[] }) => applyNodeChanges(event.changes, xynodes),
    },
    applyEdgeChanges: {
      xyedges: ({ xyedges }, event: { changes: EdgeChange<Types.Edge>[] }) => applyEdgeChanges(event.changes, xyedges),
    },
    onViewportChange: {
      viewportChangedManually: (_context, event: { manually: boolean }) => event.manually,
    },
  },
})

const {
  Provider,
  useActorRef,
  useSelector,
} = createActorContext(storeLogic)

export const StoreProvider = ({ input, children }: PropsWithChildren<{ input: Input }>) => {
  return (
    <Provider
      options={{
        inspect: inspector.inspect,
        input,
      }}
    >
      <SyncStore input={input} />
      {children}
    </Provider>
  )
}

export function useDiagramContext<T>(selector: (c: Context) => T, compare = shallowEqual) {
  const select = useCallbackRef((s: StoreSnapshot) => selector(s.context))
  return useSelector(select, compare)
}

type Logic = typeof storeLogic

export const useDiagramActorRef = useActorRef

export const useSend = () => {
  const ref = useDiagramActorRef()
  return useCallback((event: EventFromLogic<Logic>) => {
    ref.send(event)
  }, [ref])
}

const SyncStore = ({ input: { view, ...inputs } }: { input: Input }) => {
  const actor = useDiagramActorRef()

  useUpdateEffect(() => {
    actor.send({ type: 'updateInputs', inputs })
  }, [actor, ...values(inputs)])

  useUpdateEffect(() => {
    actor.send({ type: 'updateView', view })
  }, [view, actor])
  return null
}
