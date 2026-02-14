import { isArray } from 'remeda';
import { isStepEdgeId } from './scalar';
// Get the prefix of the parallel steps
// i.e. step-01.1 -> step-01.
export function getParallelStepsPrefix(id) {
    if (isStepEdgeId(id) && id.includes('.')) {
        return id.slice(0, id.indexOf('.') + 1);
    }
    return null;
}
export function isDynamicStep(step) {
    return !!step && !('__series' in step || '__parallel' in step);
}
export function isDynamicStepsParallel(step) {
    return !!step && '__parallel' in step && isArray(step.__parallel);
}
export function isDynamicStepsSeries(step) {
    return !!step && '__series' in step && isArray(step.__series);
}
