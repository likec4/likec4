import type { ElementModel } from '../../../model';
import { type AnyAux, type ElementViewRuleGroup, type NodeId } from '../../../types';
export declare class NodesGroup<A extends AnyAux = AnyAux> {
    readonly id: NodeId;
    readonly viewRule: ElementViewRuleGroup<A>;
    readonly parent: NodeId | null;
    readonly elements: ReadonlySet<ElementModel<A>>;
    static readonly kind: any;
    constructor(id: NodeId, viewRule: ElementViewRuleGroup<A>, parent?: NodeId | null, elements?: ReadonlySet<ElementModel<A>>);
    isEmpty(): boolean;
    update(elements: ReadonlySet<ElementModel<AnyAux>>): NodesGroup<A>;
    clone(): NodesGroup<AnyAux>;
}
