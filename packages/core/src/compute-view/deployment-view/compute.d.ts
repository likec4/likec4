import { type LikeC4DeploymentModel, LikeC4Model } from '../../model';
import type { AnyAux, DeploymentViewRule } from '../../types';
import { type ComputedDeploymentView, type ParsedDeploymentView as DeploymentView } from '../../types';
export declare function processPredicates(model: LikeC4DeploymentModel<any>, rules: DeploymentViewRule<any>[]): Memory;
export declare function computeDeploymentView<M extends AnyAux>(likec4model: LikeC4Model<M>, { docUri: _docUri, // exclude docUri
rules, // exclude rules
...view }: DeploymentView<NoInfer<M>>): ComputedDeploymentView<M>;
