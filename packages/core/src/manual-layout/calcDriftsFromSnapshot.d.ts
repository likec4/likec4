import { type LayoutedView, type ViewManualLayoutSnapshot } from '../types';
/**
 * Calculates drifts comparing latest autoLayouted with manual snapshot.
 *
 * @returns The autoLayouted view with calculated drifts if any.
 */
export declare function calcDriftsFromSnapshot<V extends LayoutedView>(autoLayouted: V, snapshot: ViewManualLayoutSnapshot): V;
