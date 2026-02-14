import { LikeC4Styles } from '@likec4/core/styles';
import { nonNullable } from '@likec4/core/utils';
import { attribute as _ } from 'ts-graphviz';
import { edgelabel } from './dot-labels';
import { DefaultEdgeStyle, DotPrinter } from './DotPrinter';
import { pxToInch } from './utils';
export class ProjectsViewPrinter extends DotPrinter {
    static toDot(view) {
        return new ProjectsViewPrinter(view).print();
    }
    constructor(view) {
        super(view, LikeC4Styles.DEFAULT);
    }
    createGraph() {
        const G = super.createGraph();
        G.apply({
            [_.nodesep]: pxToInch(100),
            [_.ranksep]: pxToInch(100),
        });
        G.delete(_.TBbalance);
        return G;
    }
    elementToNode(element, node) {
        node.attributes.apply({
            [_.likec4_id]: element.id,
            [_.likec4_project]: element.projectId,
        });
        return super.elementToNode(element, node);
    }
    addEdge(edge, G) {
        const source = nonNullable(this.getGraphNode(edge.source), `Node not found for ${edge.source}`);
        const target = nonNullable(this.getGraphNode(edge.target), `Node not found for ${edge.target}`);
        const edgeAttrs = this.graphology.getEdgeAttributes(edge.id);
        const e = G.edge([source, target], {
            [_.likec4_id]: edge.id,
            [_.likec4_project]: edge.projectId,
            [_.style]: edge.line ?? DefaultEdgeStyle,
        });
        if (!this.graphology.hasDirectedEdge(edge.target, edge.source) && edgeAttrs.weight > 1) {
            e.attributes.set(_.weight, edgeAttrs.weight);
        }
        const label = edgelabel(edge);
        if (label) {
            e.attributes.set(_.label, label);
        }
        if (edge.color && edge.color !== this.$defaults.relationship.color) {
            const colorValues = this.styles.colors(edge.color).relationships;
            e.attributes.apply({
                [_.color]: colorValues.line,
                [_.fontcolor]: colorValues.label,
            });
        }
        return e;
    }
}
