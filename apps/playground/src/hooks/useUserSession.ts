import { api } from '$/api'
import { useStore } from '@nanostores/react'
import { atom, onMount } from 'nanostores'

const sessionAtom = atom<
  null | {
    login: string
    userId: number
    name: string
    avatarUrl: string | null
  }
>(null)

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
