import { extractStep } from '@likec4/core';
import { first, isTruthy, last } from 'remeda';
import { attribute as _ } from 'ts-graphviz';
import { stepEdgeLabel } from './dot-labels';
import { DefaultEdgeStyle, DotPrinter } from './DotPrinter';
import { toArrowType } from './utils';
export class DynamicViewPrinter extends DotPrinter {
    postBuild(G) {
        G.delete(_.TBbalance);
        G.set(_.ordering, 'in');
    }
    addEdge(edge, G) {
        const { nodes: viewNodes } = this.view;
        const [sourceFqn, targetFqn] = edge.dir === 'back' ? [edge.target, edge.source] : [edge.source, edge.target];
        const [_sourceNode, source, ltail] = this.edgeEndpoint(sourceFqn, nodes => last(nodes));
        const [_targetNode, target, lhead] = this.edgeEndpoint(targetFqn, first);
        const e = G.edge([source, target], {
            [_.likec4_id]: edge.id,
            [_.style]: edge.line ?? DefaultEdgeStyle,
        });
        lhead && e.attributes.set(_.lhead, lhead);
        ltail && e.attributes.set(_.ltail, ltail);
        if (edge.color && edge.color !== this.$defaults.relationship.color) {
            const colorValues = this.styles.colors(edge.color).relationships;
            e.attributes.apply({
                [_.color]: colorValues.line,
                [_.fontcolor]: colorValues.label,
            });
        }
        const labelText = [
            edge.label?.trim(),
            edge.technology?.trim(),
        ].filter(isTruthy).join('\n');
        const step = extractStep(edge.id);
        const label = stepEdgeLabel(step, labelText);
        e.attributes.set(_.label, label);
        // IF we already have "seen" the target node in previous steps
        // We don't want constraints to be applied
        const sourceIdx = viewNodes.findIndex(n => n.id === sourceFqn);
        const targetIdx = viewNodes.findIndex(n => n.id === targetFqn);
        if (targetIdx < sourceIdx && edge.dir !== 'back') {
            e.attributes.apply({
                [_.minlen]: 0,
            });
        }
        let [head, tail] = [edge.head ?? this.$defaults.relationship.arrow, edge.tail ?? 'none'];
        if (edge.dir === 'back') {
            e.attributes.apply({
                [_.arrowtail]: toArrowType(head),
                [_.dir]: 'back',
            });
            if (tail !== 'none') {
                e.attributes.apply({
                    [_.arrowhead]: toArrowType(tail),
                    [_.minlen]: 0,
                });
            }
            return e;
        }
        if ((head === 'none' && tail === 'none') || (head !== 'none' && tail !== 'none')) {
            e.attributes.apply({
                [_.arrowhead]: toArrowType(head),
                [_.arrowtail]: toArrowType(tail),
                [_.dir]: 'both',
            });
            return e;
        }
        if (head === 'none') {
            e.attributes.delete(_.arrowhead);
            e.attributes.apply({
                [_.arrowtail]: toArrowType(tail),
                [_.minlen]: 0,
                [_.dir]: 'back',
            });
            return e;
        }
        e.attributes.set(_.arrowhead, toArrowType(head));
        return e;
    }
}
