import type { WritableAtom } from 'nanostores';
export declare const useAtom: <T>(atom: WritableAtom<T>) => readonly [any, (newState: T) => void];
