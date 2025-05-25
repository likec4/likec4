import { api } from '$/api'
import { useStore } from '@nanostores/react'
import { atom, onMount } from 'nanostores'

export type UserSession = {
  login: string
  userId: number
  name: string
  avatarUrl: string | null
}

const sessionAtom = atom<UserSession | null>(null)

onMount(sessionAtom, () => {
  api.auth.me().then(
    ({ session }) => sessionAtom.set(session),
    // Request failed
    () => sessionAtom.set(null),
  )
})

export function useUserSession(): UserSession | null {
  return useStore(sessionAtom)
}
