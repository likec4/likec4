import { pipe } from 'remeda';
import { invariant } from '../../utils';
import { isDescendantOf, sortParentsFirst } from '../../utils/fqn';
import { ifilter, imap, toArray, toSet } from '../../utils/iterable';
import { treeFromElements } from './utils';
const finalize = (elements, explicits) => {
    if (elements.size > 2 && explicits.size !== elements.size) {
        return new Set(sortParentsFirst([
            ...treeFromElements(elements).flatten(),
            ...explicits,
        ]));
    }
    if (elements.size > 1) {
        return new Set(sortParentsFirst([...elements]));
    }
    return elements;
};
function computeRelationships(subject, others, relationships) {
    const isOther = (e) => others.has(e);
    let subjects = new Set([subject]);
    const explicits = {
        incomers: new Set(),
        subjects: new Set([subject]),
        outgoers: new Set(),
    };
    // Iterate over incoming and outgoing relationships
    // and add the source and target elements to appropriate sets.
    // If element is deeper in the hierarchy - add all ancestors until that is a sibling of the subject
    let incomers = new Set(relationships.incoming.flatMap((r) => {
        explicits.subjects.add(r.target);
        explicits.incomers.add(r.source);
        subjects.add(r.target);
        if (r.target !== subject) {
            let target = r.target.parent;
            while (target && target !== subject) {
                subjects.add(target);
                target = target.parent;
            }
        }
        let source = r.source;
        const incomerBranch = [];
        while (true) {
            incomerBranch.push(source);
            if (isOther(source) || !source.parent) {
                break;
            }
            source = source.parent;
        }
        return incomerBranch;
    }));
    let outgoers = new Set(relationships.outgoing.flatMap((r) => {
        explicits.subjects.add(r.source);
        explicits.outgoers.add(r.target);
        subjects.add(r.source);
        if (r.source !== subject) {
            let source = r.source.parent;
            while (source && source !== subject) {
                subjects.add(source);
                source = source.parent;
            }
        }
        let target = r.target;
        const outgoerBranch = [];
        while (true) {
            outgoerBranch.push(target);
            if (isOther(target) || !target.parent) {
                break;
            }
            target = target.parent;
        }
        return outgoerBranch;
    }));
    return {
        incomers: finalize(incomers, explicits.incomers),
        incoming: new Set(relationships.incoming),
        subjects: finalize(subjects, explicits.subjects),
        outgoing: new Set(relationships.outgoing),
        outgoers: finalize(outgoers, explicits.outgoers),
    };
}
export function computeRelationshipsView(subjectId, likec4model, scopeViewId, scope = 'global') {
    const view = scopeViewId ? likec4model.findView(scopeViewId) : null;
    if (scope === 'view') {
        invariant(view, 'Scope view id is required when scope is "view"');
        return computeScopedRelationshipsView(subjectId, view, likec4model);
    }
    const subject = likec4model.element(subjectId);
    const subjectSiblings = toSet(subject.ascendingSiblings());
    return computeRelationships(subject, subjectSiblings, {
        incoming: [...subject.incoming()],
        outgoing: [...subject.outgoing()],
    });
}
function computeScopedRelationshipsView(subjectId, view, likec4model) {
    const subject = likec4model.element(subjectId);
    let relationships = {
        incoming: toArray(ifilter(subject.incoming(), (r) => view.includesRelation(r.id))),
        outgoing: toArray(ifilter(subject.outgoing(), (r) => view.includesRelation(r.id))),
    };
    const isDescendant = isDescendantOf(subject);
    const others = new Set([
        ...subject.ascendingSiblings(),
        ...pipe(view.elements(), imap((e) => e.element), ifilter((e) => e !== subject && isDescendant(e))),
    ]);
    return computeRelationships(subject, others, relationships);
}
