import { compareFqnHierarchically, hierarchyDistance, invariant, nameFromFqn, nonNullable, } from '@likec4/core/utils';
import { Graph } from '@likec4/core/utils/graphology';
import { createLogger } from '@likec4/log';
import { concat, difference, filter, flatMap, isEmpty, isNullish, isNumber, isTruthy, map, pipe, reverse, sort, take, unique, } from 'remeda';
import { attribute as _, digraph, toDot as modelToDot, } from 'ts-graphviz';
import { compoundLabel, nodeLabel } from './dot-labels';
import { compoundColor, compoundLabelColor, isCompound, pxToInch, pxToPoints } from './utils';
export const DefaultEdgeStyle = 'dashed';
const FontName = 'Arial';
const logger = createLogger('dot');
// space around clusters, but SVG output requires hack
export const GraphClusterSpace = 50.1;
export class DotPrinter {
    view;
    styles;
    ids = new Set();
    subgraphs = new Map();
    nodes = new Map();
    edges = new Map();
    compoundIds;
    edgesWithCompounds;
    graphology = new Graph({
        allowSelfLoops: true,
        multi: true,
        type: 'directed',
    });
    graphvizModel;
    constructor(view, styles) {
        this.view = view;
        this.styles = styles;
        this.compoundIds = new Set(view.nodes.filter(isCompound).map(n => n.id));
        this.edgesWithCompounds = new Set(this.compoundIds.size > 0
            ? view.edges
                .filter(e => this.compoundIds.has(e.source) || this.compoundIds.has(e.target))
                .map(n => n.id)
            : []);
        for (const node of view.nodes) {
            this.graphology.addNode(node.id, {
                origin: node,
                level: node.level,
                depth: node.depth ?? 0,
                modelRef: node.modelRef ?? null,
                deploymentRef: node.deploymentRef ?? null,
                maxConnectedHierarchyDistance: 0,
            });
        }
        for (const edge of view.edges) {
            // First compare deploymentRef of any
            let sourceFqn = this.graphology.getNodeAttribute(edge.source, 'deploymentRef');
            let targetFqn = this.graphology.getNodeAttribute(edge.target, 'deploymentRef');
            if (sourceFqn === null || targetFqn === null) {
                // Then compare modelRef
                sourceFqn = this.graphology.getNodeAttribute(edge.source, 'modelRef');
                targetFqn = this.graphology.getNodeAttribute(edge.target, 'modelRef');
            }
            let distance = -1;
            if (sourceFqn !== null && targetFqn !== null) {
                distance = hierarchyDistance(sourceFqn, targetFqn);
            }
            this.graphology.addEdgeWithKey(edge.id, edge.source, edge.target, {
                origin: edge,
                hierarchyDistance: distance,
                weight: 1,
            });
            if (distance > this.graphology.getNodeAttribute(edge.source, 'maxConnectedHierarchyDistance')) {
                this.graphology.mergeNodeAttributes(edge.source, {
                    maxConnectedHierarchyDistance: distance,
                });
            }
            if (distance > this.graphology.getNodeAttribute(edge.target, 'maxConnectedHierarchyDistance')) {
                this.graphology.mergeNodeAttributes(edge.target, {
                    maxConnectedHierarchyDistance: distance,
                });
            }
        }
        this.graphology.forEachEdge((edgeId, { hierarchyDistance }, _s, _t, sourceAttributes, targetAttributes) => {
            const maxDistance = Math.max(sourceAttributes.maxConnectedHierarchyDistance, targetAttributes.maxConnectedHierarchyDistance);
            if (maxDistance > hierarchyDistance) {
                this.graphology.mergeEdgeAttributes(edgeId, {
                    weight: maxDistance - hierarchyDistance + 1,
                });
            }
            else {
                const sourceDegree = this.graphology.directedDegree(_s);
                const targetDegree = this.graphology.directedDegree(_t);
                if (sourceDegree === 1 && targetDegree === 1 && hierarchyDistance > 1) {
                    this.graphology.mergeEdgeAttributes(edgeId, {
                        weight: hierarchyDistance,
                    });
                }
            }
        });
        const G = this.graphvizModel = this.createGraph();
        this.applyNodeAttributes(G.attributes.node);
        this.applyEdgeAttributes(G.attributes.edge);
        this.build(G);
        this.postBuild(G);
    }
    get $defaults() {
        return this.styles.defaults;
    }
    get hasEdgesWithCompounds() {
        return this.edgesWithCompounds.size > 0;
    }
    get defaultRelationshipColors() {
        const colorValues = this.styles.relationshipColors;
        return {
            line: colorValues.line,
            label: colorValues.label,
            labelBg: colorValues.labelBg,
        };
    }
    postBuild(_G) {
        // override in subclass
    }
    build(G) {
        // ----------------------------------------------
        // Traverse clusters first
        const traverseClusters = (element, parent) => {
            const id = this.generateGraphvizId(element);
            const subgraph = this.elementToSubgraph(element, parent.subgraph(id));
            this.subgraphs.set(element.id, subgraph);
            for (const childId of element.children) {
                const child = this.computedNode(childId);
                if (isCompound(child)) {
                    traverseClusters(child, subgraph);
                }
                else {
                    const gvnode = nonNullable(this.getGraphNode(child.id), `Graphviz Node not found for ${child.id}`);
                    subgraph.node(gvnode.id);
                }
            }
        };
        const topCompound = [];
        for (const element of this.view.nodes) {
            if (isCompound(element)) {
                if (isNullish(element.parent)) {
                    topCompound.push(element);
                }
            }
            else {
                const id = this.generateGraphvizId(element);
                const node = this.elementToNode(element, G.node(id));
                this.nodes.set(element.id, node);
            }
        }
        for (const compound of topCompound) {
            traverseClusters(compound, G);
        }
        for (const edge of this.view.edges) {
            const model = this.addEdge(edge, G);
            if (model) {
                this.edges.set(edge.id, model);
            }
        }
    }
    print() {
        return modelToDot(this.graphvizModel, {
            print: {
                indentStyle: 'space',
                indentSize: 2,
            },
        });
    }
    createGraph() {
        const autoLayout = this.view.autoLayout;
        const G = digraph({
            [_.likec4_viewId]: this.view.id,
            [_.bgcolor]: 'transparent',
            [_.layout]: 'dot',
            [_.compound]: true,
            [_.rankdir]: autoLayout.direction,
            [_.TBbalance]: 'min',
            [_.splines]: 'spline',
            [_.outputorder]: 'nodesfirst',
            [_.nodesep]: pxToInch(autoLayout.nodeSep ?? 110),
            [_.ranksep]: pxToInch(autoLayout.rankSep ?? 120),
            [_.pad]: pxToInch(15),
            [_.fontname]: FontName,
        });
        G.attributes.graph.apply({
            [_.fontsize]: pxToPoints(this.styles.fontSize()),
            [_.labeljust]: autoLayout.direction === 'RL' ? 'r' : 'l',
            [_.labelloc]: autoLayout.direction === 'BT' ? 'b' : 't',
            [_.margin]: GraphClusterSpace,
        });
        return G;
    }
    applyNodeAttributes(node) {
        const colors = this.styles.elementColors;
        node.apply({
            [_.fontname]: FontName,
            [_.shape]: 'rect',
            [_.fillcolor]: colors.fill,
            [_.fontcolor]: colors.hiContrast,
            [_.color]: colors.stroke,
            [_.style]: 'filled',
            [_.penwidth]: 0,
        });
    }
    applyEdgeAttributes(edge) {
        const colors = this.defaultRelationshipColors;
        edge.apply({
            [_.arrowsize]: 0.75,
            [_.fontname]: FontName,
            [_.fontsize]: pxToPoints(14),
            [_.penwidth]: pxToPoints(2),
            [_.color]: colors.line,
            [_.fontcolor]: colors.label,
        });
    }
    checkNodeId(name, isCompound = false) {
        if (isCompound) {
            name = 'cluster_' + name;
        }
        else if (name.toLowerCase().startsWith('cluster')) {
            name = 'nd_' + name;
        }
        if (!this.ids.has(name)) {
            this.ids.add(name);
            return name;
        }
        return null;
    }
    generateGraphvizId(node) {
        const _compound = isCompound(node);
        let elementName = nameFromFqn(node.id).toLowerCase();
        let name = this.checkNodeId(elementName, _compound);
        if (name !== null) {
            return name;
        }
        // use post-index
        elementName = nameFromFqn(node.id).toLowerCase();
        let i = 1;
        do {
            name = this.checkNodeId(elementName + '_' + i++, _compound);
        } while (name === null);
        return name;
    }
    elementToSubgraph(compound, subgraph) {
        invariant(isCompound(compound), 'node should be compound');
        invariant(isNumber(compound.depth), 'node.depth should be defined');
        const colorValues = this.styles.colors(compound.color).elements;
        const textColor = compoundLabelColor(colorValues.loContrast);
        subgraph.apply({
            [_.likec4_id]: compound.id,
            [_.likec4_level]: compound.level,
            [_.likec4_depth]: compound.depth,
            [_.fillcolor]: compoundColor(colorValues.fill, compound.depth),
            [_.color]: compoundColor(colorValues.stroke, compound.depth),
            [_.style]: 'filled',
            [_.margin]: pxToPoints(compound.children.length > 1 ? 40 : 32),
        });
        if (!isEmpty(compound.title.trim())) {
            subgraph.set(_.label, compoundLabel(compound, textColor));
        }
        return subgraph;
    }
    elementToNode(element, node) {
        invariant(!isCompound(element), 'node should not be compound');
        const hasIcon = isTruthy(element.icon);
        const colorValues = this.styles.colors(element.color).elements;
        const { values: { padding, sizes: { width, height } } } = this.styles.nodeSizes(element.style);
        let paddingX = hasIcon ? 8 : padding;
        node.attributes.apply({
            [_.likec4_id]: element.id,
            [_.likec4_level]: element.level,
            [_.label]: nodeLabel(element, this.styles),
            [_.margin]: `${pxToInch(paddingX)},${pxToInch(padding)}`,
        });
        node.attributes.set(_.width, pxToInch(width));
        node.attributes.set(_.height, pxToInch(height));
        if (!this.styles.isDefaultColor(element.color)) {
            node.attributes.apply({
                [_.fillcolor]: colorValues.fill,
                [_.fontcolor]: colorValues.hiContrast,
                [_.color]: colorValues.stroke,
            });
        }
        switch (element.shape) {
            case 'cylinder':
            case 'storage': {
                node.attributes.apply({
                    [_.margin]: `${pxToInch(paddingX)},${pxToInch(0)}`,
                    [_.penwidth]: pxToPoints(2),
                    [_.shape]: 'cylinder',
                });
                break;
            }
            case 'browser': {
                node.attributes.apply({
                    [_.margin]: `${pxToInch(hasIcon ? paddingX : paddingX + 4)},${pxToInch(padding + 6)}`,
                });
                break;
            }
            case 'mobile': {
                node.attributes.apply({
                    [_.margin]: `${pxToInch(hasIcon ? paddingX : paddingX + 4)},${pxToInch(padding)}`,
                });
                break;
            }
            case 'queue': {
                node.attributes.apply({
                    [_.width]: pxToInch(width),
                    [_.height]: pxToInch(height - 8),
                    [_.margin]: `${pxToInch(hasIcon ? paddingX : paddingX + 4)},${pxToInch(padding)}`,
                });
                break;
            }
            case 'component': {
                node.attributes.apply({
                    [_.width]: pxToInch(width + 10),
                    [_.margin]: `${pxToInch(paddingX + 20)},${pxToInch(padding)}`,
                });
                break;
            }
            default:
                break;
        }
        return node;
    }
    leafElements(parentId) {
        if (parentId === null) {
            return this.view.nodes.filter(n => !isCompound(n));
        }
        return this.computedNode(parentId).children.flatMap(childId => {
            const child = this.computedNode(childId);
            return isCompound(child) ? this.leafElements(child.id) : child;
        });
    }
    descendants(parentId) {
        if (parentId === null) {
            return this.view.nodes.slice();
        }
        return this.computedNode(parentId).children.flatMap(childId => {
            const child = this.computedNode(childId);
            return [child, ...this.descendants(child.id)];
        });
    }
    computedNode(id) {
        return nonNullable(this.view.nodes.find(n => n.id === id), `Node ${id} not found`);
    }
    getGraphNode(id) {
        return this.nodes.get(id) ?? null;
    }
    getSubgraph(id) {
        return this.subgraphs.get(id) ?? null;
    }
    /**
     * In case edge has a cluster as endpoint,
     * pick nested node to use as endpoint
     */
    edgeEndpoint(endpointId, pickFromCluster) {
        let element = this.computedNode(endpointId);
        let endpoint = this.getGraphNode(endpointId);
        // see https://graphviz.org/docs/attrs/lhead/
        let logicalEndpoint;
        if (endpoint) {
            return [element, endpoint, undefined];
        }
        invariant(isCompound(element), 'endpoint node should be compound');
        // Edge with cluster as endpoint
        logicalEndpoint = this.getSubgraph(endpointId)?.id;
        invariant(logicalEndpoint, `subgraph ${endpointId} not found`);
        element = nonNullable(pickFromCluster(this.leafElements(endpointId)), `leaf element in ${endpointId} not found`);
        endpoint = nonNullable(this.getGraphNode(element.id), `source graphviz node ${element.id} not found`);
        return [element, endpoint, logicalEndpoint];
    }
    findInternalEdges(parentId) {
        if (parentId === null) {
            return this.view.edges.slice();
        }
        const parent = this.computedNode(parentId);
        return pipe(this.descendants(parentId), flatMap(child => {
            return concat(child.inEdges, child.outEdges);
        }), unique(), difference(concat(parent.inEdges, parent.outEdges)), map(edgeId => this.view.edges.find(e => e.id === edgeId)), filter(isTruthy));
    }
    withoutCompoundEdges(element) {
        if (this.edgesWithCompounds.size === 0) {
            return element;
        }
        return {
            ...element,
            inEdges: element.inEdges.filter(e => !this.edgesWithCompounds.has(e)),
            outEdges: element.outEdges.filter(e => !this.edgesWithCompounds.has(e)),
        };
    }
    assignGroups() {
        const groups = pipe(this.view.nodes, filter(isCompound), map(n => n.id), sort(compareFqnHierarchically), reverse(), map(id => {
            // edges only inside clusters, compound endpoints are not considered
            const edges = this.findInternalEdges(id).filter(e => e.source !== e.target && !this.compoundIds.has(e.source) && !this.compoundIds.has(e.target));
            return { id, edges };
        }), filter(({ edges }) => edges.length > 1 && edges.length < 8), 
        // take only first 4 groups, otherwise grahviz eats the memory
        take(4));
        const processed = new Set();
        for (const group of groups) {
            const edges = group.edges.filter(e => !processed.has(e.source) && !processed.has(e.target));
            for (const edge of edges) {
                try {
                    const sourceNode = nonNullable(this.getGraphNode(edge.source), `Graphviz Node not found for ${edge.source}`);
                    const targetNode = nonNullable(this.getGraphNode(edge.target), `Graphviz Node not found for ${edge.target}`);
                    processed.add(edge.source);
                    processed.add(edge.target);
                    sourceNode.attributes.set(_.group, group.id);
                    targetNode.attributes.set(_.group, group.id);
                }
                catch (error) {
                    logger.error(`Failed to assign group to edge ${edge.id}`, { error });
                }
            }
        }
    }
    /**
     * Use coordinates from given diagram as initial position for nodes
     * (try to keep existing layout as much as possible)
     */
    applyManualLayout({ height, ...layout }) {
        const offsetX = layout.x < 0 ? -layout.x : 0;
        const offsetY = layout.y < 0 ? -layout.y : 0;
        const _isShifted = offsetX > 0 || offsetY > 0;
        for (const { id, ...manual } of layout.nodes) {
            // we pin only nodes, not clusters
            const model = this.getGraphNode(id);
            if (!model) {
                continue;
            }
            // Invert Y axis and convert to inches
            const x = pxToInch(manual.center.x) + offsetX;
            const y = pxToInch(height - manual.center.y);
            if (manual.fixedsize) {
                model.attributes.apply({
                    [_.pos]: `${x},${y}!`,
                    [_.pin]: true,
                    [_.width]: pxToInch(manual.fixedsize.width),
                    [_.height]: pxToInch(manual.fixedsize.height),
                    [_.fixedsize]: true,
                });
            }
            else {
                // Not pinned, but suggested position
                model.attributes.set(_.pos, `${x},${y}`);
            }
        }
        for (const [, edgeModel] of this.edges.entries()) {
            edgeModel.attributes.delete(_.weight);
            edgeModel.attributes.delete(_.minlen);
            edgeModel.attributes.delete(_.constraint);
        }
        // TODO: apply manual layout fails when there are edges with compounds
        // Array.from(this.edgesWithCompounds.values()).forEach(edgeId => {
        //   const edge = this.edges.get(edgeId)!
        //   if (!edge) {
        //     return
        //   }
        //   const source = edge.attributes.get(_.ltail) ?? edge.targets[0]
        //   const target = edge.attributes.get(_.lhead) ?? edge.targets[1]
        //   edge.attributes.delete(_.ltail)
        //   edge.attributes.delete(_.lhead)
        //   const xlabel = edge.attributes.get(_.xlabel)
        //   if (xlabel) {
        //     edge.attributes.delete(_.xlabel)
        //     edge.attributes.set(_.label, xlabel)
        //   }
        //   this.graphvizModel.edge([source, target]).attributes.apply(edge.attributes.values)
        //   this.graphvizModel.removeEdge(edge)
        // })
        this.graphvizModel.apply({
            [_.layout]: 'fdp',
            // [_.scale]: 72.0,
            [_.overlap]: 'vpsc',
            [_.sep]: '+50,50',
            [_.esep]: '+10,10',
            [_.start]: 'random2',
            [_.splines]: 'compound',
            [_.K]: 10,
        });
        this.graphvizModel.delete(_.compound);
        this.graphvizModel.delete(_.rankdir);
        this.graphvizModel.delete(_.nodesep);
        this.graphvizModel.delete(_.ranksep);
        this.graphvizModel.delete(_.pack);
        this.graphvizModel.delete(_.pad);
        this.graphvizModel.delete(_.packmode);
        this.graphvizModel.attributes.graph.delete(_.margin);
        return this;
    }
}
