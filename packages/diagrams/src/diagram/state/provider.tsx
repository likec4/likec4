import { Provider, createStore } from 'jotai'
import { useState, type PropsWithChildren } from 'react'

export function DiagramStateProvider({ children }: PropsWithChildren) {
  const [store] = useState(() => createStore())
  return <Provider store={store}>{children}</Provider>
}
