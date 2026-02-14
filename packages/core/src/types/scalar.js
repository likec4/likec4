import { isEmptyish, isString, isTruthy } from 'remeda';
import { invariant } from '../utils';
export function ProjectId(name) {
    return name;
}
export function MarkdownOrString(value) {
    if (typeof value === 'string') {
        return { txt: value };
    }
    return value;
}
export function flattenMarkdownOrString(value) {
    if (isEmptyish(value)) {
        return null;
    }
    const content = isString(value) ? value : value.txt ?? value.md;
    return isTruthy(content?.trim()) ? content : null;
}
export const NoneIcon = 'none';
export function Fqn(name, parent) {
    return (parent ? parent + '.' + name : name);
}
export const GroupElementKind = '@group';
export function isGroupElementKind(v) {
    return v.kind === GroupElementKind;
}
export function DeploymentFqn(name, parent) {
    return (parent ? parent + '.' + name : name);
}
export function ViewId(id) {
    return id;
}
export function RelationId(id) {
    return id;
}
export function GlobalFqn(projectId, name) {
    invariant(typeof projectId === 'string' && projectId != '');
    return '@' + projectId + '.' + name;
}
export function isGlobalFqn(fqn) {
    return fqn.startsWith('@');
}
export function splitGlobalFqn(fqn) {
    if (!fqn.startsWith('@')) {
        return [null, fqn];
    }
    const firstDot = fqn.indexOf('.');
    if (firstDot < 2) {
        throw new Error('Invalid global FQN');
    }
    const projectId = fqn.slice(1, firstDot);
    const name = fqn.slice(firstDot + 1);
    return [projectId, name];
}
export function NodeId(id) {
    return id;
}
export function EdgeId(id) {
    return id;
}
export function stepEdgeId(step, parallelStep) {
    const id = `step-${String(step).padStart(2, '0')}`;
    return parallelStep ? `${id}.${parallelStep}` : id;
}
export const StepEdgeKind = '@step';
export function isStepEdgeId(id) {
    return id.startsWith('step-');
}
export function extractStep(id) {
    if (!isStepEdgeId(id)) {
        throw new Error(`Invalid step edge id: ${id}`);
    }
    return parseFloat(id.slice('step-'.length));
}
