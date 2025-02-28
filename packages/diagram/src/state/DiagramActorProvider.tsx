import type { ViewId } from '@likec4/core'
import { useCallbackRef } from '@mantine/hooks'
import { useActorRef, useSelector } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { type PropsWithChildren, useEffect, useRef } from 'react'
import { useDiagramEventHandlersRef } from '../context/DiagramEventHandlers'
import { DiagramFeatures, useEnabledFeatures } from '../context/DiagramFeatures'
import { DiagramActorSafeContext } from '../hooks/safeContext'
import { useUpdateEffect } from '../hooks/useUpdateEffect'
import type { Types } from '../likec4diagram/types'
import { type Input, diagramMachine } from './diagram-machine'
// import { inspector } from './inspector'
import { syncManualLayoutActorLogic } from './syncManualLayoutActor'
import type { DiagramActorRef } from './types'

type ActorContextInput = Omit<Input, 'xystore' | 'features'>
export function DiagramActorProvider({ input, children }: PropsWithChildren<{ input: ActorContextInput }>) {
  const handlersRef = useDiagramEventHandlersRef()
  const xystore = useStoreApi<Types.Node, Types.Edge>()

  const actorRef = useActorRef(
    diagramMachine.provide({
      actions: {
        'trigger:NavigateTo': ((_, { viewId }) => {
          handlersRef.current.onNavigateTo?.(viewId as ViewId)
        }),

        'trigger:OnChange': ((_, params) => {
          handlersRef.current.onChange?.(params)
        }),

        'trigger:OpenSource': ((_, params) => {
          handlersRef.current.onOpenSource?.(params)
        }),
      },
      actors: {
        syncManualLayoutActorLogic: syncManualLayoutActorLogic.provide({
          actions: {
            'trigger:OnChange': ((_, params) => {
              handlersRef.current.onChange?.(params)
            }),
          },
        }),
      },
    }),
    {
      id: `diagram:${input.view.id}`,
      systemId: 'diagram',
      // ...inspector,
      input: {
        xystore,
        ...input,
      },
    },
  )

  return (
    (
      <DiagramActorSafeContext value={actorRef}>
        <SyncStore input={input} actorRef={actorRef} />
        <DiagramActorToggledFeatures actorRef={actorRef}>
          {children}
        </DiagramActorToggledFeatures>
      </DiagramActorSafeContext>
    )
  )
}

const SyncStore = (
  { input: { view, xyedges, xynodes, ...inputs }, actorRef }: { input: ActorContextInput; actorRef: DiagramActorRef },
) => {
  const features = useEnabledFeatures()
  useUpdateEffect(() => {
    actorRef.send({ type: 'update.inputs', inputs })
  }, [actorRef, inputs])

  useEffect(() => {
    actorRef.send({ type: 'update.features', features })
  }, [actorRef, features])

  const frameReq = useRef<number>(null)

  useUpdateEffect(() => {
    frameReq.current = requestAnimationFrame(() => {
      frameReq.current = null
      actorRef.send({ type: 'update.view', view, xyedges, xynodes })
    })
    return () => {
      if (frameReq.current != null) {
        cancelAnimationFrame(frameReq.current)
      }
      frameReq.current = null
    }
  }, [actorRef, view, xyedges, xynodes])

  return null
}

function DiagramActorToggledFeatures({ children, actorRef }: PropsWithChildren<{ actorRef: DiagramActorRef }>) {
  const toggledFeatures = useSelector(actorRef, useCallbackRef(s => s.context.toggledFeatures), shallowEqual)
  return (
    <DiagramFeatures overrides={toggledFeatures}>
      {children}
    </DiagramFeatures>
  )
}
