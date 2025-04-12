import type { SessionData } from '#worker'
import { api } from '$/api'
import { useStore } from '@nanostores/react'
import { atom, onMount } from 'nanostores'

const sessionAtom = atom<SessionData | null>(null)

onMount(sessionAtom, () => {
  api.auth.me().then(
    ({ session }) => sessionAtom.set(session),
    // Request failed
    () => sessionAtom.set(null),
  )
})

export const useUserSession = () => {
  return useStore(sessionAtom)
}
