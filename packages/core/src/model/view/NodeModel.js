import { isTruthy } from 'remeda';
import { isGroupElementKind, RichText, } from '../../types';
import { memoizeProp } from '../../utils';
export class NodeModel {
    Aux;
    $viewModel;
    $view;
    $node;
    constructor($viewModel, $node) {
        this.$viewModel = $viewModel;
        this.$view = $viewModel.$view;
        this.$node = $node;
    }
    get id() {
        return this.$node.id;
    }
    get title() {
        return this.$node.title;
    }
    get kind() {
        return this.$node.kind;
    }
    get description() {
        return RichText.memoize(this, 'description', this.$node.description);
    }
    get technology() {
        return this.$node.technology ?? null;
    }
    get notes() {
        return RichText.memoize(this, 'notes', this.$node.notes);
    }
    get parent() {
        return this.$node.parent ? this.$viewModel.node(this.$node.parent) : null;
    }
    get element() {
        const modelRef = this.$node.modelRef;
        return modelRef ? this.$viewModel.$model.element(modelRef) : null;
    }
    get deployment() {
        const modelRef = this.$node.deploymentRef;
        return modelRef ? this.$viewModel.$model.deployment.element(modelRef) : null;
    }
    get shape() {
        return this.$node.shape;
    }
    get color() {
        return this.$node.color;
    }
    get icon() {
        return this.$node.icon ?? null;
    }
    get tags() {
        return this.$node.tags;
    }
    get links() {
        return this.$node.links ?? [];
    }
    get navigateTo() {
        return this.$node.navigateTo ? this.$viewModel.$model.view(this.$node.navigateTo) : null;
    }
    get style() {
        return this.$node.style;
    }
    get x() {
        return 'x' in this.$node ? this.$node.x : undefined;
    }
    get y() {
        return 'y' in this.$node ? this.$node.y : undefined;
    }
    get width() {
        return 'width' in this.$node ? this.$node.width : undefined;
    }
    get height() {
        return 'height' in this.$node ? this.$node.height : undefined;
    }
    children() {
        return memoizeProp(this, 'children', () => new Set(this.$node.children.map((child) => this.$viewModel.node(child))));
    }
    /**
     * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
     * (from closest to root)
     */
    *ancestors() {
        let parent = this.parent;
        while (parent) {
            yield parent;
            parent = parent.parent;
        }
        return;
    }
    *siblings() {
        const siblings = this.parent?.children() ?? this.$viewModel.roots();
        for (const sibling of siblings) {
            if (sibling.id !== this.id) {
                yield sibling;
            }
        }
        return;
    }
    *incoming(filter = 'all') {
        for (const edgeId of this.$node.inEdges) {
            const edge = this.$viewModel.edge(edgeId);
            switch (true) {
                case filter === 'all':
                case filter === 'direct' && edge.target.id === this.id:
                case filter === 'to-descendants' && edge.target.id !== this.id:
                    yield edge;
                    break;
            }
        }
        return;
    }
    *incomers(filter = 'all') {
        const unique = new Set();
        for (const r of this.incoming(filter)) {
            if (unique.has(r.source.id)) {
                continue;
            }
            unique.add(r.source.id);
            yield r.source;
        }
        return;
    }
    *outgoing(filter = 'all') {
        for (const edgeId of this.$node.outEdges) {
            const edge = this.$viewModel.edge(edgeId);
            switch (true) {
                case filter === 'all':
                case filter === 'direct' && edge.source.id === this.id:
                case filter === 'from-descendants' && edge.source.id !== this.id:
                    yield edge;
                    break;
            }
        }
        return;
    }
    *outgoers(filter = 'all') {
        const unique = new Set();
        for (const r of this.outgoing(filter)) {
            if (unique.has(r.target.id)) {
                continue;
            }
            unique.add(r.target.id);
            yield r.target;
        }
        return;
    }
    isLayouted() {
        return 'width' in this.$node && 'height' in this.$node;
    }
    hasChildren() {
        return this.$node.children.length > 0;
    }
    hasParent() {
        return this.$node.parent !== null;
    }
    /**
     * Check if this node references to logical model element.
     */
    hasElement() {
        return isTruthy(this.$node.modelRef);
    }
    /**
     * Check if this node references to deployment element (Node or Instance).
     */
    hasDeployment() {
        return isTruthy(this.$node.deploymentRef);
    }
    /**
     * Check if this node references to deployed instance
     * Deployed instance always references to element and deployment element.
     */
    hasDeployedInstance() {
        return this.hasElement() && this.hasDeployment();
    }
    isGroup() {
        return isGroupElementKind(this.$node);
    }
    /**
     * Checks if the node has the given tag.
     */
    isTagged(tag) {
        return this.tags.includes(tag);
    }
}
