import { castDraft, produce } from 'immer';
import { hasAtLeast, pipe } from 'remeda';
import { _layout, } from '../types';
import { ifilter, ihead } from '../utils';
import { applyManualLayout } from './applyManualLayout';
/**
 * Calculates drifts comparing latest autoLayouted with manual snapshot.
 *
 * @returns The autoLayouted view with calculated drifts if any.
 */
export function calcDriftsFromSnapshot(autoLayouted, snapshot) {
    const { drifts, ...manual } = applyManualLayout(autoLayouted, snapshot);
    if (!drifts || drifts.length === 0) {
        return produce(autoLayouted, draft => {
            // No drifts, ensure drifts are cleared
            delete draft.drifts;
            // Ensure layout type is set to auto
            draft[_layout] = 'auto';
        });
    }
    const viewDrifts = new Set();
    if (drifts.includes('type-changed')) {
        viewDrifts.add('type-changed');
    }
    const manualNodes = new Map(manual.nodes.map(n => [n.id, n]));
    const manualEdges = new Map(manual.edges.map(e => [e.id, e]));
    const nodes = autoLayouted.nodes.map((node) => {
        const snapshotNode = manualNodes.get(node.id);
        if (snapshotNode) {
            manualNodes.delete(snapshotNode.id);
        }
        return produce(node, draft => {
            if (!snapshotNode) {
                viewDrifts.add('nodes-added');
                draft.drifts = ['added'];
                return;
            }
            if (snapshotNode.drifts) {
                viewDrifts.add('nodes-drift');
                draft.drifts = [...snapshotNode.drifts];
            }
            else {
                // Clear drifts if any comes from `autoLayouted`
                delete draft.drifts;
            }
        });
    });
    if (manualNodes.size > 0) {
        // Some snapshot nodes were not processed, meaning they were removed
        viewDrifts.add('nodes-removed');
    }
    const edges = autoLayouted.edges.map((edge) => {
        const snapshotEdge = manualEdges.get(edge.id) ?? pipe(manualEdges.values(), ifilter(e => e.source === edge.source && e.target === edge.target), ihead());
        if (snapshotEdge) {
            manualEdges.delete(snapshotEdge.id);
        }
        return produce(edge, draft => {
            if (!snapshotEdge) {
                viewDrifts.add('edges-added');
                draft.drifts = ['added'];
                return;
            }
            if (snapshotEdge.drifts) {
                viewDrifts.add('edges-drift');
                draft.drifts = [...snapshotEdge.drifts];
            }
            else {
                // Clear drifts if any comes from `autoLayouted`
                delete draft.drifts;
            }
        });
    });
    if (manualEdges.size > 0) {
        // Some snapshot edges were not processed, meaning they were removed
        viewDrifts.add('edges-removed');
    }
    const _viewDrifts = [...viewDrifts];
    return produce(autoLayouted, draft => {
        // No drifts, ensure drifts are cleared
        if (hasAtLeast(_viewDrifts, 1)) {
            draft.drifts = _viewDrifts;
        }
        else {
            // No drifts, ensure drifts are cleared
            delete draft.drifts;
        }
        draft.nodes = castDraft(nodes);
        draft.edges = castDraft(edges);
        // Ensure layout type is set to auto
        draft[_layout] = 'auto';
    });
}
