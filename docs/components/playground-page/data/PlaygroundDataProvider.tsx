import { Provider, createStore } from 'jotai'
import { DevTools, useAtomsDevtools } from 'jotai-devtools'
import { useHydrateAtoms } from 'jotai/utils'
import { useMemo } from 'react'
import { currentFileAtom, filesAtom, viewsReadyAtom } from './atoms'
import { BigBankPlayground } from './initial/bigbank'
import { GettingStartedPlayground } from './initial/getting-started'

export type PlaygroundDataProviderProps = {
  variant: 'bigbank' | 'getting-started'
}

function InitJotaiAtoms({ variant, children }: React.PropsWithChildren<PlaygroundDataProviderProps>) {
  // initialising on state with prop on render here
  const initial = variant === 'bigbank' ? BigBankPlayground : GettingStartedPlayground
  useHydrateAtoms([
    [currentFileAtom, initial.current],
    [viewsReadyAtom, false],
    [filesAtom, {...initial.files}]
  ])
  useAtomsDevtools(variant)
  return <>{children}</>
}

export function PlaygroundDataProvider({ variant, children }: React.PropsWithChildren<PlaygroundDataProviderProps>) {

  const jotaiStore = useMemo(() => createStore(), [variant])

  return <Provider store={jotaiStore}>
      <InitJotaiAtoms variant={variant}>
        <DevTools store={jotaiStore} />
        {children}
      </InitJotaiAtoms>
    </Provider>
}
