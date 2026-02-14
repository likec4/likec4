import type { NTuple } from '../types';
import type { ElementColorValues } from './types';
/**
 * Compute color values for compound nodes (for six depth levels)
 *
 * @param base The base element colors
 */
export declare function computeCompoundColorValues<Depth extends number = 6>(base: ElementColorValues, depth?: Depth): NTuple<ElementColorValues, Depth>;
