import { useStore } from '@nanostores/react'
import { atom, onMount } from 'nanostores'

const headerVisibleAtom = atom(true)

onMount(headerVisibleAtom, () => {
  headerVisibleAtom.set(true)
})

export const useHeaderVisible = () => useStore(headerVisibleAtom)

export const headerOps = {
  toggle: (value?: boolean) => headerVisibleAtom.set(value ?? !headerVisibleAtom.get()),
  show: () => headerVisibleAtom.set(true),
  hide: () => headerVisibleAtom.set(false),
}
