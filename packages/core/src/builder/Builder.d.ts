import { LikeC4Model } from '../model/LikeC4Model';
import type { aux, ParsedLikeC4ModelData } from '../types';
import type { AnyTypes, BuilderProjectSpecification, BuilderSpecification, Types } from './_types';
import type { DeloymentModelBuildFunction, DeloymentModelHelpers } from './Builder.deploymentModel';
import type { ModelBuilderFunction, ModelHelpers } from './Builder.model';
import { type ViewsBuilderFunction, type ViewsHelpers } from './Builder.views';
import type { BuilderMethods } from './Builder.with';
export interface Builder<T extends AnyTypes> extends BuilderMethods<T> {
    /**
     * Only available in compile time
     */
    readonly Types: T;
    clone(): Builder<T>;
    /**
     * Builders for each element kind
     */
    helpers(): {
        model: ModelHelpers<T>;
        views: ViewsHelpers;
        deployment: DeloymentModelHelpers<T>;
    };
    /**
     * Adds model elements
     *
     * @example
     *  builder.model(({ el }, _) =>
     *    _(
     *      el('a'),
     *      el('a.b').with(
     *        el('c')
     *      )
     *    )
     *  )
     *
     *  builder.model((_, m) =>
     *    m(
     *      _.el('a'),
     *      _.el('a.b').with(
     *        _.el('c')
     *      )
     *    )
     *  )
     */
    model<Out extends AnyTypes>(callback: ModelBuilderFunction<T, Out>): Builder<Out>;
    /**
     * Adds deployment model
     *
     * @example
     *  builder.deployment(({ node, instanceOf }, _) =>
     *    _(
     *      node('node1'),
     *      node('node1.child1').with(
     *        instanceOf('model.element')
     *      )
     *    )
     *  )
     *
     * @example
     *  builder.deployment((_,d) =>
     *    d(
     *      _.node('node1'),
     *      _.node('node1.child1').with(
     *        _.instanceOf('model.element')
     *      )
     *    )
     *  )
     */
    deployment<Out extends AnyTypes>(callback: DeloymentModelBuildFunction<T, Out>): Builder<Out>;
    /**
     * Adds views
     *
     * @example
     *  builder.views(({ view, viewOf, deploymentView, $include, $style, $rules }, _) =>
     *    _(
     *      view('view1').with(
     *        $include('a -> b'),
     *      ),
     *      view('view2', {
     *        title: 'View 2',
     *      }).with(
     *        $include('*')
     *      ),
     *      view(
     *        'view3',
     *        {
     *          title: 'View 3',
     *        },
     *        $rules(
     *          $include('*'),
     *          $style(['*', 'alice'], {
     *            color: 'red',
     *          }),
     *        ),
     *      ),
     *      viewOf('viewOfA', 'a').with(
     *        $include('*')
     *      ),
     *      deploymentView('deploymentView1').with(
     *        $include('a -> b')
     *      ),
     *    )
     *  )
     */
    views<Out extends AnyTypes>(callback: ViewsBuilderFunction<T, Out>): Builder<Out>;
    /**
     * Returns model as result of parsing only
     * Views are not computed or layouted
     * {@link toLikeC4Model} should be used to get model with computed views
     */
    build<const ProjectId extends string>(project: ProjectId): ParsedLikeC4ModelData<aux.setProject<Types.ToAux<T>, ProjectId>>;
    build<const Project extends BuilderProjectSpecification>(project: Project): ParsedLikeC4ModelData<aux.setProject<Types.ToAux<T>, Project['id']>>;
    build(): ParsedLikeC4ModelData<Types.ToAux<T>>;
    /**
     * Returns Computed LikeC4Model
     */
    toLikeC4Model<const ProjectId extends string>(project: ProjectId): LikeC4Model.Computed<aux.setProject<Types.ToAux<T>, ProjectId>>;
    toLikeC4Model<const Project extends BuilderProjectSpecification>(project: Project): LikeC4Model.Computed<aux.setProject<Types.ToAux<T>, Project['id']>>;
    toLikeC4Model(): LikeC4Model.Computed<Types.ToAux<T>>;
}
export declare const Builder: {
    /**
     * Creates a builder with compositional methods
     *
     * @example
     * ```ts
     * const {
     *   model: { model, system, component, relTo },
     *   deployment: { env, vm},
     *   views: { view, $include },
     *   builder,
     * } = Builder.forSpecification({
     *   elements: {
     *     system: {},
     *     component: {},
     *   },
     *   deployments: ['env', 'vm'],
     * })
     *
     * const b = builder
     *   .with(
     *     model(
     *       system('cloud').with(
     *         component('backend'),
     *         component('backend.api'),
     *         component('frontend').with(
     *           relTo('cloud.backend.api'),
     *         ),
     *       ),
     *     ),
     *   )
     * ```
     */
    forSpecification<const Spec extends BuilderSpecification>(spec: Spec): {
        builder: Builder<Types.FromSpecification<Spec>>;
        model: ModelHelpers<Types.FromSpecification<Spec>>;
        deployment: DeloymentModelHelpers<Types.FromSpecification<Spec>>;
        views: ViewsHelpers;
    };
    /**
     * Creates a builder with chainable methods
     *
     * @example
     * ```ts
     * const b = Builder
     *   .specification({
     *     elements: ['system', 'component'],
     *     deployments: ['env', 'vm'],
     *   })
     *   .model(({ system, component, relTo }, _) =>
     *     _(
     *       system('cloud').with(
     *         component('backend').with(
     *           component('api'),
     *         ),
     *         component('frontend').with(
     *           relTo('cloud.backend.api'),
     *         )
     *       )
     *     )
     *   )
     * ```
     */
    specification<const Spec extends BuilderSpecification>(spec: Spec): Builder<Types.FromSpecification<Spec>>;
};
export declare namespace Builder {
    type Any = Builder<AnyTypes>;
}
