import { useStore } from '@nanostores/react';
import { useCallback } from 'react';
export const useAtom = (atom) => {
    const state = useStore(atom);
    const setAtom = useCallback((newState) => {
        atom.set(newState);
    }, [atom]);
    return [state, setAtom];
};
