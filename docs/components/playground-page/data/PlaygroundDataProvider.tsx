import { Provider, createStore } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'
import { useMemo } from 'react'
import { currentFileAtom, filesAtom, viewsReadyAtom } from './atoms'
import { BigBankPlayground, GettingStartedPlayground, BlankPlayground } from './initial'

export type PlaygroundDataProviderProps = {
  variant: 'bigbank' | 'getting-started' | 'blank'
}

function InitJotaiAtoms({
  variant,
  children
}: React.PropsWithChildren<PlaygroundDataProviderProps>) {
  // initialising on state with prop on render here
  let initial
  switch (variant) {
    case 'bigbank': {
      initial = BigBankPlayground
      break
    }
    case 'getting-started': {
      initial = GettingStartedPlayground
      break
    }
    case 'blank': {
      initial = BlankPlayground
      break
    }
  }
  useHydrateAtoms([
    [currentFileAtom, initial.current],
    [viewsReadyAtom, false],
    [filesAtom, { ...initial.files }]
  ])
  return <>{children}</>
}

export function PlaygroundDataProvider({
  variant,
  children
}: React.PropsWithChildren<PlaygroundDataProviderProps>) {
  const jotaiStore = useMemo(() => createStore(), [variant])

  return (
    <Provider store={jotaiStore}>
      <InitJotaiAtoms variant={variant}>{children}</InitJotaiAtoms>
    </Provider>
  )
}
