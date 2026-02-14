import { DeployedInstanceModel, DeploymentNodeModel, DeploymentRelationModel, NestedElementOfDeployedInstanceModel, } from './DeploymentElementModel';
import { ElementModel } from './ElementModel';
import { RelationshipModel } from './RelationModel';
import { EdgeModel } from './view/EdgeModel';
import { LikeC4ViewModel } from './view/LikeC4ViewModel';
import { NodeModel } from './view/NodeModel';
export function isDeploymentNodeModel(model) {
    return model instanceof DeploymentNodeModel;
}
export function isDeployedInstanceModel(model) {
    return model instanceof DeployedInstanceModel;
}
export function isDeploymentElementModel(model) {
    return isDeploymentNodeModel(model) || isDeployedInstanceModel(model);
}
export function isNestedElementOfDeployedInstanceModel(model) {
    return model instanceof NestedElementOfDeployedInstanceModel;
}
export function isDeploymentRelationModel(x) {
    return x instanceof DeploymentRelationModel;
}
export function isRelationModel(x) {
    return x instanceof RelationshipModel;
}
export { isRelationModel as isModelRelation, isRelationModel as isRelationshipModel, };
export function isElementModel(element) {
    return element instanceof ElementModel;
}
export function isLikeC4ViewModel(view) {
    return view instanceof LikeC4ViewModel;
}
export function isNodeModel(node) {
    return node instanceof NodeModel;
}
export function isEdgeModel(edge) {
    return edge instanceof EdgeModel;
}
