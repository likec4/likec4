import { isTruthy } from 'remeda';
export function isDeploymentNode(el) {
    return isTruthy(el.kind) && !isTruthy(el.element);
}
export function isDeployedInstance(el) {
    return isTruthy(el.element) && !isTruthy(el.kind);
}
