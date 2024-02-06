import { createIsolation } from 'jotai-scope'

export const {
  Provider: JotaiProvider,
  useAtom,
  useSetAtom,
  useAtomValue
} = createIsolation()
