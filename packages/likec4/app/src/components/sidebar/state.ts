import { useStore } from '@nanostores/react'
import { atom, onMount } from 'nanostores'

const drawerOpenedAtom = atom(false)

onMount(drawerOpenedAtom, () => {
  drawerOpenedAtom.set(false)
})

export const useDrawerOpened = () => useStore(drawerOpenedAtom)

export const SidebarDrawerOps = {
  open: () => drawerOpenedAtom.set(true),
  close: () => drawerOpenedAtom.set(false)
}
