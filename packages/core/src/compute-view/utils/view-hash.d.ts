import type { SetOptional } from 'type-fest';
import { type ComputedView } from '../../types';
export declare function calcViewLayoutHash<V extends ComputedView>(view: SetOptional<V, 'hash'>): V;
