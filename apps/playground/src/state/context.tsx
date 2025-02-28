import { PlaygroundActorSafeContext } from '$/hooks/safeContext'
import { useUpdateEffect } from '@react-hookz/web'
import { useActorRef } from '@xstate/react'
import type { PropsWithChildren } from 'react'
// import { inspector } from './inspector'
import { type PlaygroundInput, playgroundMachine } from './playground-machine'

export function PlaygroundActorContextProvider(
  { children, workspace }: PropsWithChildren<{ workspace: PlaygroundInput }>,
) {
  const playgroundActor = useActorRef(playgroundMachine, {
    // ...(import.meta.env.DEV ? inspector : {}),
    systemId: 'playground',
    input: workspace,
  })

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
