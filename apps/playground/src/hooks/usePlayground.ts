import { Examples } from '$/examples'
import {
  type PlaygroundActorRef,
  type PlaygroundActorSnapshot,
  type PlaygroundContext,
} from '$state/types'
import { type ViewChange, type ViewId, nonNullable } from '@likec4/core'
import type { Locate as LocateRequest } from '@likec4/language-server/protocol'
import { useSelector } from '@xstate/react'
import { deepEqual, shallowEqual } from 'fast-equals'
import { type DependencyList, useCallback, useMemo } from 'react'
import { keys } from 'remeda'
import {
  _useOptionalPlaygroundActorRef as useOptionalPlaygroundActorRef,
  _usePlaygroundActorRef as usePlaygroundActorRef,
} from './safeContext'

export { useOptionalPlaygroundActorRef, usePlaygroundActorRef }

export function usePlayground() {
  const playgroundActor = usePlaygroundActorRef()

  return useMemo(() => ({
    get actor(): PlaygroundActorRef {
      return playgroundActor
    },
    get workspaceId() {
      return playgroundActor.getSnapshot().context.workspaceId
    },
    get value() {
      return playgroundActor.getSnapshot().value
    },
    send: playgroundActor.send,
    getSnapshot: (): PlaygroundActorSnapshot => playgroundActor.getSnapshot(),
    getContext: (): PlaygroundContext => playgroundActor.getSnapshot().context,
    getActiveFile: () => {
      const ctx = playgroundActor.getSnapshot().context
      return ({
        filename: ctx.activeFilename,
        text: ctx.files[ctx.activeFilename] ?? '',
        isChanged: ctx.files[ctx.activeFilename] !== ctx.originalFiles[ctx.activeFilename],
      })
    },

    changeActiveFile: (filename: string) => {
      const ctx = playgroundActor.getSnapshot().context
      if (ctx.activeFilename !== filename) {
        playgroundActor.send({
          type: 'workspace.changeActiveFile',
          filename,
        })
      }
    },

    changeActiveView: (viewId: ViewId) => {
      playgroundActor.send({
        type: 'workspace.changeActiveView',
        viewId,
      })
    },

    openSources: (target: LocateRequest.Params) => {
      playgroundActor.send({
        type: 'workspace.openSources',
        target,
      })
    },

    applyViewChanges: (change: ViewChange) => {
      playgroundActor.send({
        type: 'workspace.applyViewChanges',
        change,
      })
    },
  }), [playgroundActor])
}

export function usePlaygroundContext<T = unknown>(
  selector: (state: PlaygroundContext) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
  deps: DependencyList = [],
) {
  const playgroundActor = usePlaygroundActorRef()
  const select = useCallback((s: PlaygroundActorSnapshot) => selector(s.context), deps)
  return useSelector(playgroundActor, select, compare)
}
export function usePlaygroundSnapshot<T = unknown>(
  selector: (state: PlaygroundActorSnapshot) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
  deps: DependencyList = [],
) {
  const playgroundActor = usePlaygroundActorRef()
  return useSelector(playgroundActor, useCallback(selector, deps), compare)
}

const selectWorkspace = (snapshot: PlaygroundActorSnapshot) => ({
  workspaceId: snapshot.context.workspaceId,
  workspaceTitle: snapshot.context.workspaceTitle,
  filenames: keys(snapshot.context.files),
  activeFilename: snapshot.context.activeFilename,
  isExample: !!Examples[snapshot.context.workspaceId as keyof typeof Examples],
  hasChanges: !shallowEqual(snapshot.context.files, snapshot.context.originalFiles),
})
export function usePlaygroundWorkspace() {
  const playgroundActor = usePlaygroundActorRef()
  return useSelector(playgroundActor, selectWorkspace, deepEqual)
}

const selectWorkspaceActiveFile = (snapshot: PlaygroundActorSnapshot) => ({
  filename: snapshot.context.activeFilename,
  text: snapshot.context.files[snapshot.context.activeFilename] ?? '',
  isChanged: snapshot.context.files[snapshot.context.activeFilename] !==
    snapshot.context.originalFiles[snapshot.context.activeFilename],
})
export function usePlaygroundActiveFile() {
  const playgroundActor = usePlaygroundActorRef()
  return useSelector(playgroundActor, selectWorkspaceActiveFile, shallowEqual)
}

const selectLikeC4Model = (snapshot: PlaygroundActorSnapshot) => snapshot.context.likec4model
export function usePlaygroundLikeC4Model() {
  const playgroundActor = usePlaygroundActorRef()
  const likeC4Model = useSelector(playgroundActor, selectLikeC4Model)
  return nonNullable(likeC4Model, 'LikeC4 model is not loaded')
}
