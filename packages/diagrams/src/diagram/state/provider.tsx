import { createStore, Provider } from 'jotai'
import { type PropsWithChildren, useState } from 'react'

export function DiagramStateProvider({ children }: PropsWithChildren) {
  const [store] = useState(() => createStore())
  return <Provider store={store}>{children}</Provider>
}
