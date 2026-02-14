import { type DependenciesComparator, type EffectHook } from '@react-hookz/web';
import type { DependencyList, EffectCallback } from 'react';
export declare const depsShallowEqual: DependenciesComparator;
export declare function useUpdateEffect<Callback extends EffectCallback = EffectCallback, Deps extends DependencyList = DependencyList>(callback: Callback, deps: Deps, equalityFn?: DependenciesComparator<Deps>, effectHook?: EffectHook<Callback, Deps>): void;
