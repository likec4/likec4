import { type LayoutedView, type ViewManualLayoutSnapshot } from '../types';
/**
 * Proof-of-concept
 * Use layout from the snapshot, and 'safe'-apply style properties from the `autoLayouted` view
 *
 * @param autoLayouted Auto-layouted view
 * @param snapshot The view snapshot with manual-layout
 * @returns The snapshot with the next view applied
 */
export declare function applyManualLayout<V extends LayoutedView>(autoLayouted: V, snapshot: ViewManualLayoutSnapshot): V;
