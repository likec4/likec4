import { nonNullable } from '@likec4/core/utils';
import { first, forEach, groupBy, isNonNullish, last, map, pipe, tap, values } from 'remeda';
import { attribute as _ } from 'ts-graphviz';
import { edgelabel } from './dot-labels';
import { DefaultEdgeStyle, DotPrinter } from './DotPrinter';
import { pxToInch, pxToPoints, toArrowType } from './utils';
export class DeploymentViewPrinter extends DotPrinter {
    createGraph() {
        const G = super.createGraph();
        const autoLayout = this.view.autoLayout;
        G.delete(_.TBbalance);
        G.apply({
            [_.nodesep]: pxToInch(autoLayout.nodeSep ?? 130),
            [_.ranksep]: pxToInch(autoLayout.rankSep ?? 130),
        });
        return G;
    }
    postBuild(G) {
        pipe(this.view.nodes, map(nd => ({
            node: nd,
            graphvizNode: this.getGraphNode(nd.id),
        })), groupBy(({ node, graphvizNode }) => {
            if (graphvizNode == null) {
                return undefined;
            }
            return node.modelRef;
        }), values(), map(nodes => nodes), forEach((nodes) => {
            if (nodes.length < 2) {
                return;
            }
            G.subgraph({
                [_.rank]: 'same',
            }, subgraph => {
                for (const { graphvizNode } of nodes) {
                    subgraph.node(nonNullable(graphvizNode).id);
                }
            });
        }), tap(() => {
            G.set(_.newrank, true);
            G.set(_.clusterrank, 'global');
            G.delete(_.pack);
            G.delete(_.packmode);
        }));
    }
    elementToSubgraph(compound, subgraph) {
        const sub = super.elementToSubgraph(compound, subgraph);
        if (compound.children.length > 1) {
            sub.set(_.margin, pxToPoints(50));
        }
        return sub;
    }
    addEdge(edge, G) {
        // const [sourceFqn, targetFqn] = edge.dir === 'back' ? [edge.target, edge.source] : [edge.source, edge.target]
        const [sourceFqn, targetFqn] = [edge.source, edge.target];
        const [sourceNode, source, ltail] = this.edgeEndpoint(sourceFqn, nodes => last(nodes));
        const [targetNode, target, lhead] = this.edgeEndpoint(targetFqn, first);
        const hasCompoundEndpoint = isNonNullish(lhead) || isNonNullish(ltail);
        const e = G.edge([source, target], {
            [_.likec4_id]: edge.id,
            [_.style]: edge.line ?? DefaultEdgeStyle,
        });
        lhead && e.attributes.set(_.lhead, lhead);
        ltail && e.attributes.set(_.ltail, ltail);
        const weight = this.graphology.getEdgeAttribute(edge.id, 'weight');
        if (weight > 1 && !this.graphology.hasDirectedEdge(edge.target, edge.source)) {
            e.attributes.set(_.weight, weight);
        }
        const label = edgelabel(edge);
        if (label) {
            e.attributes.set(hasCompoundEndpoint ? _.xlabel : _.label, label);
        }
        if (edge.color && edge.color !== this.$defaults.relationship.color) {
            const colorValues = this.styles.colors(edge.color).relationships;
            e.attributes.apply({
                [_.color]: colorValues.line,
                [_.fontcolor]: colorValues.label,
            });
        }
        let [head, tail] = [edge.head ?? this.$defaults.relationship.arrow, edge.tail ?? 'none'];
        if (head === 'none' && tail === 'none') {
            e.attributes.apply({
                [_.arrowtail]: 'none',
                [_.arrowhead]: 'none',
                [_.dir]: 'none',
            });
            return e;
        }
        if (edge.dir === 'both') {
            e.attributes.apply({
                [_.arrowhead]: toArrowType(head),
                [_.arrowtail]: toArrowType(edge.tail ?? head),
                [_.dir]: 'both',
            });
            if (!hasCompoundEndpoint && sourceNode.modelRef !== targetNode.modelRef) {
                e.attributes.set(_.constraint, false);
            }
            return e;
        }
        if (head) {
            e.attributes.set(_.arrowhead, toArrowType(head));
        }
        if (tail !== 'none') {
            e.attributes.set(_.arrowtail, toArrowType(tail));
        }
        return e;
    }
}
