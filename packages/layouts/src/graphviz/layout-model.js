import { LikeC4Model } from '@likec4/core/model';
import { _stage } from '@likec4/core/types';
import { invariant } from '@likec4/core/utils';
import { mapToObj } from 'remeda';
import { QueueGraphvizLayoter } from './QueueGraphvizLayoter';
/**
 * Layouts all views in the computed model.
 * @param model - The model to layout.
 * @param options - Options for th2 layouter.
 * @returns A promise that resolves to the layouted model.
 */
export async function layoutLikeC4Model(model, options) {
    if (model.isLayouted()) {
        return Promise.resolve(model.asLayouted);
    }
    invariant(model.isComputed(), 'Model is not computed');
    const layouter = new QueueGraphvizLayoter(options);
    const styles = model.$styles;
    const layoutResult = await layouter.batchLayout({
        batch: [...model.asComputed.views()].map(view => ({
            view: view.$view,
            styles,
        })),
    });
    return LikeC4Model.create({
        ...model.asLayouted.$data,
        [_stage]: 'layouted',
        views: mapToObj(layoutResult, ({ diagram }) => [diagram.id, diagram]),
    });
}
