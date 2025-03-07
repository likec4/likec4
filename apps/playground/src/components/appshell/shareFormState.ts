import type { ShareOptions } from '$state/shareOptions'
import { customAlphabet } from 'nanoid'
import { atom, computed } from 'nanostores'

export const $expires = atom<ShareOptions.ExpiresValue>('M1')
export const $pincode = atom(customAlphabet('123456789ABCDE', 4)())
export const $access = atom<ShareOptions.AccessValue>('any')
export const $forkable = atom(true)

export function generateRandomPincode() {
  $pincode.set(customAlphabet('123456789ABCDE', 4)())
}

export const $generateBtnDisabled = computed($access, (v) => v.startsWith('github:'))
