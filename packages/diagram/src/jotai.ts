import { createIsolation } from 'jotai-scope'

export const {
  Provider: IsolatedJotaiProvider,
  useAtom,
  useSetAtom,
  useAtomValue
} = createIsolation()
