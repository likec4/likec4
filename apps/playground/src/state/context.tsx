import { PlaygroundActorSafeContext } from '$hooks/safeContext'
import { useUpdateEffect } from '@react-hookz/web'
import { useActorRef } from '@xstate/react'
import type { PropsWithChildren } from 'react'
// import { inspector } from './inspector'
import { useEffect } from 'react'
import { type PlaygroundInput, playgroundMachine } from './playground-machine'

export function PlaygroundActorContextProvider(
  { children, workspace }: PropsWithChildren<{ workspace: PlaygroundInput }>,
) {
  const playgroundActor = useActorRef(playgroundMachine, {
    // ...(import.meta.env.DEV ? inspector : {}),
    systemId: 'playground',
    input: workspace,
  })

  useEffect(() => {
    const printViewStates = () => {
      const ctx = playgroundActor.getSnapshot().context
      console.log('ActiveViewId:', ctx.activeViewId)
      console.dir(ctx.viewStates, { depth: Infinity })
    }
    // @ts-ignore
    globalThis['$likec4'] = {
      actor: playgroundActor,
      printViewStates,
    }
    return () => {
      // @ts-ignore
      delete globalThis['$likec4']
    }
  }, [playgroundActor])

  useUpdateEffect(() => {
    playgroundActor.send({
      type: 'workspace.switch',
      workspace,
    })
  }, [workspace.workspaceId])

  return (
    <PlaygroundActorSafeContext value={playgroundActor}>
      {children}
    </PlaygroundActorSafeContext>
  )
}
