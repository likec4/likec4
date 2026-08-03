import type { DiagramView, DynamicViewDisplayVariant, WhereOperator } from '@likec4/core/types'
import { useActorRef, useSelector } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { type PropsWithChildren, memo, useEffect, useRef } from 'react'
import { isNullish } from 'remeda'
import { useDiagramEventHandlersRef } from '../../context/DiagramEventHandlers'
import { DiagramFeatures, useEnabledFeatures } from '../../context/DiagramFeatures'
import { useEditorActorLogic } from '../../editor/useEditorActorLogic'
import {
  DiagramActorContextProvider,
  DiagramApiContextProvider,
  selectDiagramContext,
  selectDiagramSnapshot,
  useDiagramActorRef,
  useDiagramSelector,
} from '../../hooks/safeContext'
import {
  useDiagram,
  useOnDiagramEvent,
} from '../../hooks/useDiagram'
import { useOptionalLikeC4Model } from '../../hooks/useLikeC4Model'
import { useUpdateEffect } from '../../hooks/useUpdateEffect'
import type { ViewPaddings } from '../../LikeC4Diagram.props'
import type { StoryActorSnapshot } from '../../story/actor'
import { resolveCurrentScene } from '../../story/resolveScene'
import { useOptionalResolveSceneView } from '../../story/resolveSceneView'
import type { Types } from '../types'
import { DiagramApi } from './diagram-api'
import { diagramMachine } from './machine'
import { DiagramToggledFeaturesPersistence } from './persistence'

export function DiagramActorProvider({
  id,
  view,
  zoomable,
  pannable,
  nodesDraggable,
  nodesSelectable,
  fitViewPadding,
  where = null,
  children,
  dynamicViewVariant: _defaultVariant,
}: PropsWithChildren<{
  id: string
  view: DiagramView
  zoomable: boolean
  pannable: boolean
  nodesDraggable: boolean
  nodesSelectable: boolean
  fitViewPadding: ViewPaddings
  where?: WhereOperator | null
  dynamicViewVariant?: DynamicViewDisplayVariant | undefined
}>) {
  const xystore = useStoreApi<Types.Node, Types.Edge>()

  const editor = useEditorActorLogic()
  const features = useEnabledFeatures()
  // Model-bound resolver for the story actor's cursor, supplied here rather
  // than via a corrective event so it's already the real implementation by
  // the time either of the actor's spawn sites (`machine.ts`'s root `entry:`,
  // `machine.state.navigating.ts`'s `syncStoryActor`) reads `context.resolve`
  // — see `Input.resolve`'s JSDoc in `machine.setup.ts`. Optional-model-safe
  // because this provider mounts for every view type, not just stories.
  const resolve = useOptionalResolveSceneView()

  const actor = useActorRef(
    diagramMachine.provide({
      actors: {
        editor,
      },
    }),
    {
      id: `diagram-${id}`,
      systemId: 'diagram',
      // ...inspector,
      input: {
        xystore,
        view,
        zoomable,
        pannable,
        fitViewPadding,
        nodesDraggable,
        nodesSelectable,
        where,
        features,
        dynamicViewVariant: _defaultVariant,
        resolve,
      },
    },
  )
  const actorRef = useRef(actor)
  if (actorRef.current !== actor) {
    console.warn('DiagramMachine actor instance changed', {
      previous: actorRef.current.getSnapshot().context,
      current: actor.getSnapshot().context,
    })
    actorRef.current = actor
  }

  useEffect(() => {
    actor.send({ type: 'update.features', features })
  }, [actor, features])

  useUpdateEffect(
    () =>
      actor.send({
        type: 'update.inputs',
        inputs: { zoomable, where, pannable, fitViewPadding, nodesDraggable, nodesSelectable },
      }),
    [actor, zoomable, where, pannable, fitViewPadding, nodesDraggable, nodesSelectable],
  )

  useUpdateEffect(() => {
    if (!_defaultVariant) return
    actor.send({ type: 'switch.dynamicViewVariant', variant: _defaultVariant })
  }, [actor, _defaultVariant])

  useEffect(
    () => actor.send({ type: 'update.view', view, source: 'external' }),
    [actor, view],
  )

  return (
    <DiagramActorContextProvider value={actor}>
      <DiagramApiContextProvider value={DiagramApi.withActor(actorRef)}>
        <ToggledFeatures>
          {children}
        </ToggledFeatures>
        <PropagateDiagramActorEvents />
        <StoryCursorSync />
      </DiagramApiContextProvider>
    </DiagramActorContextProvider>
  )
}

const selectToggledFeatures = selectDiagramContext(context => {
  let toggledFeatures = context.toggledFeatures

  const hasDrifts = context.view.drifts != null && context.view.drifts.length > 0

  const enableCompareWithLatest = hasDrifts
    && context.features.enableCompareWithLatest
    && (toggledFeatures.enableCompareWithLatest ?? false)
    // Compare with latest is disabled during active walkthrough
    && isNullish(context.activeWalkthrough)

  const enableReadOnly = context.features.enableReadOnly
    || toggledFeatures.enableReadOnly
    // Active walkthrough forces readonly
    || !!context.activeWalkthrough
    // Compare with latest enforces readonly
    || (enableCompareWithLatest && context.view._layout === 'auto')

  // Update toggled features if changed
  if (
    toggledFeatures.enableReadOnly !== enableReadOnly ||
    toggledFeatures.enableCompareWithLatest !== enableCompareWithLatest
  ) {
    toggledFeatures = {
      ...toggledFeatures,
      enableCompareWithLatest,
      enableReadOnly,
    }
  }

  return toggledFeatures
})

function ToggledFeatures({ children }: PropsWithChildren) {
  const toggledFeatures = useDiagramSelector(selectToggledFeatures)
  useUpdateEffect(() => {
    DiagramToggledFeaturesPersistence.write(toggledFeatures)
  }, [toggledFeatures])
  return (
    <DiagramFeatures overrides={toggledFeatures}>
      {children}
    </DiagramFeatures>
  )
}

const PropagateDiagramActorEvents = memo(() => {
  const diagram = useDiagram()

  const handlers = useDiagramEventHandlersRef()

  useOnDiagramEvent('openSource', ({ params }) => handlers.current.onOpenSource?.(params))
  useOnDiagramEvent('navigateTo', ({ viewId }) => handlers.current.onNavigateTo?.(viewId))
  // useOnDiagramEvent('onChange', ({ change }) => handlers.current.onChange?.({ change }))
  useOnDiagramEvent('onLayoutTypeChange', ({ layoutType }) => {
    handlers.current.onLayoutTypeChange?.(layoutType)
  })
  useOnDiagramEvent(
    'initialized',
    ({ instance: xyflow }) => {
      try {
        handlers.current.onInitialized?.({ diagram, xyflow })
      } catch (error) {
        console.error(error)
      }
    },
    { once: true },
  )

  return null
})

const selectStoryActor = selectDiagramSnapshot(s => s.children.story ?? undefined)

function selectCursor(snapshot: StoryActorSnapshot | undefined) {
  return snapshot?.context.cursor ?? null
}

/**
 * The story cursor's dispatch link: whenever the story actor's cursor moves
 * (`next`/`prev`/`gotoScene`, from `StoryControls.tsx` or `navigateTo`
 * interception in `diagram-api.ts`), resolves the scene it now points to and
 * dispatches `story.scene` so the canvas actually repaints. Without this, the
 * cursor advances but nothing the viewer sees ever changes — see this task's
 * brief and RFC 0001, "Diagram integration".
 *
 * Lives here, not in the story actor itself, because resolving a scene needs
 * `LikeC4Model` (`resolveCurrentScene` → `resolveScene` → `model.findView`),
 * and an XState actor cannot reach `useLikeC4Model`.
 *
 * `previousRef` tracks the last *resolved* (already offset-applied) scene —
 * exactly what the previous `story.scene` dispatch carried as `view` — as the
 * alignment target for the next one, per `resolveCurrentScene`'s own JSDoc.
 * It resets to `null` whenever the story actor ref itself changes (a fresh
 * session: initial mount, or `syncStoryActor` respawning on mid-session
 * entry into a story), since a fresh session has nothing on screen yet to
 * align its first scene against.
 */
const StoryCursorSync = memo(() => {
  const diagramActor = useDiagramActorRef()
  const model = useOptionalLikeC4Model()
  const storyActor = useDiagramSelector(selectStoryActor)
  const cursor = useSelector(storyActor, selectCursor)

  const previousRef = useRef<DiagramView | null>(null)

  useEffect(() => {
    previousRef.current = null
  }, [storyActor])

  useEffect(() => {
    if (!model || !storyActor || !cursor) {
      return
    }
    const { flow } = storyActor.getSnapshot().context
    const resolved = resolveCurrentScene({
      cursor,
      flow,
      model,
      previous: previousRef.current,
      // `flow.view` is the story's *own* view — not `diagramActor`'s
      // `context.view`, which `story.scene` (`machine.ts`) overwrites with
      // whichever scene is currently rendered as soon as the first one is
      // dispatched. `flow.view.sceneLayout` stays correct for the entire
      // session, mount-time or mid-session, regardless of how many scenes
      // have played.
      sceneLayout: flow.view.sceneLayout,
    })
    if (!resolved) {
      return
    }
    previousRef.current = resolved.view
    diagramActor.send({ type: 'story.scene', cursor, view: resolved.view })
  }, [diagramActor, model, storyActor, cursor])

  return null
})
StoryCursorSync.displayName = 'StoryCursorSync'
