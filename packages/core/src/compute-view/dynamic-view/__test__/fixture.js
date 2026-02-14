import { partition } from 'remeda';
import { fakeModel } from '../../element-view/__test__/fixture';
import { computeDynamicView } from '../compute';
const emptyView = {
    _type: 'dynamic',
    id: 'index',
    title: null,
    description: null,
    tags: null,
    links: null,
    rules: [],
};
export function $step(expr, props) {
    const title = typeof props === 'string' ? props : props?.title;
    if (expr.includes(' -> ')) {
        const [source, target] = expr.split(' -> ');
        return {
            source: source,
            target: target,
            astPath: '',
            ...(typeof props === 'object' ? props : {}),
            title: title ?? null,
        };
    }
    if (expr.includes(' <- ')) {
        const [target, source] = expr.split(' <- ');
        return {
            source: source,
            target: target,
            astPath: '',
            ...(typeof props === 'object' ? props : {}),
            title: title ?? null,
            isBackward: true,
        };
    }
    throw new Error(`Invalid step expression: ${expr}`);
}
export function compute(stepsAndRules) {
    const [steps, rules] = partition(stepsAndRules, (s) => 'source' in s);
    let view = computeDynamicView(fakeModel, {
        ...emptyView,
        steps,
        rules: rules,
    });
    return Object.assign(view, {
        nodeIds: view.nodes.map((node) => node.id),
        edgeIds: view.edges.map((edge) => edge.id),
    });
}
