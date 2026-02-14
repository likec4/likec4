import { customAlphabet } from 'nanoid';
import { atom, computed } from 'nanostores';
export const $expires = atom('M3');
export const $pincode = atom(customAlphabet('123456789ABCDE', 4)());
export const $access = atom('any');
export const $forkable = atom(true);
export function generateRandomPincode() {
    $pincode.set(customAlphabet('123456789ABCDE', 4)());
}
export const $generateBtnDisabled = computed($access, (v) => v.startsWith('github:'));
