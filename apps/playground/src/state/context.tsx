import { PlaygroundActorSafeContext } from '$/hooks/safeContext'
import { useUpdateEffect } from '@likec4/diagram'
import { useActorRef } from '@xstate/react'
import type { PropsWithChildren } from 'react'
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
  }, [workspace])

  return (
    <PlaygroundActorSafeContext value={playgroundActor}>
      {children}
    </PlaygroundActorSafeContext>
  )
}
