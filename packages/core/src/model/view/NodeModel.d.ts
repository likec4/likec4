import { type Any, type Color, type ComputedNodeStyle, type ElementShape as C4ElementShape, type IconUrl, type IteratorLike, type LayoutedView, type Link, type RichTextOrEmpty, type scalar, GroupElementKind } from '../../types';
import type * as aux from '../../types/_aux';
import type { DeployedInstanceModel, DeploymentElementModel } from '../DeploymentElementModel';
import type { ElementModel } from '../ElementModel';
import type { $View, IncomingFilter, OutgoingFilter, WithTags } from '../types';
import type { EdgesIterator } from './EdgeModel';
import type { LikeC4ViewModel } from './LikeC4ViewModel';
export type NodesIterator<M extends Any, V extends $View<M>> = IteratorLike<NodeModel<M, V>>;
export declare class NodeModel<A extends Any = Any, V extends $View<A> = $View<A>> implements WithTags<A> {
    readonly Aux: A;
    readonly $viewModel: LikeC4ViewModel<A, V>;
    readonly $view: V;
    readonly $node: V['nodes'][number];
    constructor($viewModel: LikeC4ViewModel<A, V>, $node: V['nodes'][number]);
    get id(): scalar.NodeId;
    get title(): string;
    get kind(): aux.ElementKind<A> | aux.DeploymentKind<A> | typeof GroupElementKind | 'instance';
    get description(): RichTextOrEmpty;
    get technology(): string | null;
    get notes(): RichTextOrEmpty;
    get parent(): NodeModel<A, V> | null;
    get element(): ElementModel<A> | null;
    get deployment(): DeploymentElementModel<A> | null;
    get shape(): C4ElementShape;
    get color(): Color;
    get icon(): IconUrl | null;
    get tags(): aux.Tags<A>;
    get links(): ReadonlyArray<Link>;
    get navigateTo(): LikeC4ViewModel<A> | null;
    get style(): ComputedNodeStyle;
    get x(): number | undefined;
    get y(): number | undefined;
    get width(): number | undefined;
    get height(): number | undefined;
    children(): ReadonlySet<NodeModel<A, V>>;
    /**
     * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
     * (from closest to root)
     */
    ancestors(): NodesIterator<A, V>;
    siblings(): NodesIterator<A, V>;
    incoming(filter?: IncomingFilter): EdgesIterator<A, V>;
    incomers(filter?: IncomingFilter): NodesIterator<A, V>;
    outgoing(filter?: OutgoingFilter): EdgesIterator<A, V>;
    outgoers(filter?: OutgoingFilter): NodesIterator<A, V>;
    isLayouted(): this is NodeModel.Layouted<A>;
    hasChildren(): boolean;
    hasParent(): this is NodeModel.WithParent<A, V>;
    /**
     * Check if this node references to logical model element.
     */
    hasElement(): this is NodeModel.WithElement<A, V>;
    /**
     * Check if this node references to deployment element (Node or Instance).
     */
    hasDeployment(): this is NodeModel.WithDeploymentElement<A, V>;
    /**
     * Check if this node references to deployed instance
     * Deployed instance always references to element and deployment element.
     */
    hasDeployedInstance(): this is NodeModel.WithDeployedInstance<A, V>;
    isGroup(): this is NodeModel.IsGroup<A, V>;
    /**
     * Checks if the node has the given tag.
     */
    isTagged(tag: aux.LooseTag<A>): boolean;
}
export declare namespace NodeModel {
    type Layouted<A> = A extends aux.AnyLayouted ? NodeModel<A, LayoutedView<A>> & {
        x: number;
        y: number;
        width: number;
        height: number;
    } : never;
    interface WithParent<A extends Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
        readonly parent: NodeModel<A, V>;
    }
    interface WithElement<A extends Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
        readonly kind: aux.ElementKind<A>;
        readonly element: ElementModel<A>;
    }
    interface WithDeploymentElement<A extends Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
        readonly kind: aux.DeploymentKind<A>;
        readonly deployment: DeploymentElementModel<A>;
    }
    interface WithDeployedInstance<A extends Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
        readonly kind: 'instance';
        readonly element: ElementModel<A>;
        readonly deployment: DeployedInstanceModel<A>;
    }
    interface IsGroup<A extends Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
        readonly kind: typeof GroupElementKind;
        readonly element: null;
        readonly deployment: null;
    }
}
