import { GroupElementKind } from '../../../types';
export class NodesGroup {
    id;
    viewRule;
    parent;
    elements;
    static kind = GroupElementKind;
    constructor(id, viewRule, parent = null, elements = new Set()) {
        this.id = id;
        this.viewRule = viewRule;
        this.parent = parent;
        this.elements = elements;
    }
    isEmpty() {
        return this.elements.size === 0;
    }
    update(elements) {
        return new NodesGroup(this.id, this.viewRule, this.parent, elements);
    }
    clone() {
        return new NodesGroup(this.id, this.viewRule, this.parent, new Set(this.elements));
    }
}
