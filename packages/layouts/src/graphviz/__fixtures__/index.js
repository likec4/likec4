import { computeView, withReadableEdges } from '@likec4/core/compute-view';
import { LikeC4Model } from '@likec4/core/model';
import { omit } from 'remeda';
import { amazonView, cloud3levels, cloudView, FakeModel, indexView, issue577View } from './model';
export const parsedModel = LikeC4Model.fromDump(FakeModel);
export const computeElementView = (view) => {
    const result = computeView(view, parsedModel);
    if (!result.isSuccess) {
        throw result.error;
    }
    return omit(withReadableEdges(result.view), ['nodeIds', 'edgeIds']);
};
export const [computedIndexView, computedCloudView, computedCloud3levels, computedAmazonView] = [
    computeElementView(indexView),
    computeElementView(cloudView),
    computeElementView(cloud3levels),
    // Add hasManualLayout to verify that it is preserved
    Object.assign(computeElementView(amazonView), { hasManualLayout: true }),
];
export const issue577_fail = computeElementView(issue577View('https://icons/aws%20&%20CloudFront.svg'));
export const issue577_valid = computeElementView(issue577View('https://icons/aws%20%20CloudFront.svg'));
