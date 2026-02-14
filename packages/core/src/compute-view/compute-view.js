import { mapValues } from 'remeda';
import { LikeC4Model } from '../model';
import { _stage, isDeploymentView, isDynamicView, isElementView, } from '../types';
import { nonexhaustive } from '../utils';
import { computeDeploymentView } from './deployment-view/compute';
import { computeDynamicView } from './dynamic-view/compute';
import { computeElementView } from './element-view/compute';
export function unsafeComputeView(viewsource, likec4model) {
    switch (true) {
        case isElementView(viewsource):
            return computeElementView(likec4model, viewsource);
        case isDeploymentView(viewsource):
            return computeDeploymentView(likec4model, viewsource);
        case isDynamicView(viewsource):
            return computeDynamicView(likec4model, viewsource);
        default:
            nonexhaustive(viewsource);
    }
}
export function computeView(viewsource, likec4model) {
    try {
        return {
            isSuccess: true,
            view: unsafeComputeView(viewsource, likec4model),
        };
    }
    catch (e) {
        return {
            isSuccess: false,
            error: e instanceof Error ? e : new Error(`Unknown error: ${e}`),
            view: undefined,
        };
    }
}
export function computeParsedModelData(parsed) {
    const likec4model = LikeC4Model.create(parsed);
    let { views: _views, _stage: __omitted, ...rest } = parsed;
    const views = mapValues(_views, v => unsafeComputeView(v, likec4model));
    return {
        [_stage]: 'computed',
        ...rest,
        views: views,
    };
}
export function computeLikeC4Model(parsed) {
    return LikeC4Model.create(computeParsedModelData(parsed));
}
