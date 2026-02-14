"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementNode = elementNode;
exports.deploymentNode = deploymentNode;
exports.compoundElementNode = compoundElementNode;
exports.compoundDeploymentNode = compoundDeploymentNode;
exports.viewGroupNode = viewGroupNode;
exports.sequenceActorNode = sequenceActorNode;
var useLikeC4Model_1 = require("../hooks/useLikeC4Model");
function customDiagramNode(Node) {
    return (function (props) {
        var viewId = props.data.viewId;
        var likec4 = (0, useLikeC4Model_1.useLikeC4Model)();
        var viewModel = likec4.findView(viewId);
        if (!viewModel) {
            console.error("View \"".concat(viewId, "\" not found, requested by customNode \"").concat(props.data.id, "\""), { props: props });
            return null;
        }
        var model = viewModel.findNode(props.data.id);
        if (!model) {
            console.error("Node \"".concat(props.id, "\" not found in view \"").concat(viewId, "\", requested by customNode \"").concat(props.data.id, "\""), { props: props });
            return null;
        }
        return <Node nodeProps={props} nodeModel={model}/>;
    });
}
/**
 * Node that will be used to render the element from the model.
 * It is a leaf node, i.e. it does not have children.
 *
 * Custom node renderer receives these props:
 * - `nodeProps`: props from XYFlow
 * - `nodeModel`: LikeC4 {@link NodeModel.WithElement}
 *
 * @see [Default implementation](https://github.com/likec4/likec4/blob/main/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx)
 *
 * @example
 * ```tsx
 * import {
 *   elementNode,
 *   ElementNodeContainer,
 *   ElementShape,
 *   ElementData,
 *   ElementActions,
 *   ElementDetailsButtonWithHandler,
 *   IfEnabled,
 *   IfNotReadOnly,
 *   ElementToolbar,
 *   DefaultHandles,
 *   ElementTags
 * } from '@likec4/diagram/custom'
 *
 * const CustomElementNode = elementNode(({ nodeProps, nodeModel }) => (
 *   <ElementNodeContainer nodeProps={nodeProps}>
 *     <ElementShape {...nodeProps} />
 *     <ElementData {...nodeProps} />
 *     <IfEnabled feature="ElementTags">
 *       <ElementTags {...nodeProps} />
 *     </IfEnabled>
 *     <ElementActions
 *       {...nodeProps}
 *       extraButtons={[
 *         {
 *           key: 'plus',
 *           icon: <IconPlus />,
 *           onClick: () => console.log('extra'),
 *         },
 *       ]}
 *     />
 *     <ElementDetailsButtonWithHandler {...nodeProps} />
 *     {nodeModel.element.getMetadata('your-attr') === 'value' && <YourComponent />}
 *     <IfNotReadOnly>
 *       <ElementToolbar {...nodeProps} />
 *     </IfNotReadOnly>
 *     <DefaultHandles />
 *   </ElementNodeContainer>
 * ))
 * ```
 */
function elementNode(component) {
    return customDiagramNode(component);
}
/**
 * Node that will be used to render the element from deployment model.
 * It is a leaf node, i.e. it does not have children.
 * Can be {@link DeploymentNodeModel} or {@link DeployedInstanceModel}.
 *
 * Custom node renderer receives these props:
 * - `nodeProps`: props from XYFlow
 * - `nodeModel`: {@link NodeModel.WithDeploymentElement}
 *
 * @see [Default implementation](https://github.com/likec4/likec4/blob/main/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx)
 *
 * @example
 * ```tsx
 * import {
 *   deploymentNode,
 *   ElementNodeContainer,
 *   ElementShape,
 *   ElementData,
 *   DeploymentElementActions,
 *   ElementDetailsButtonWithHandler,
 *   IfNotReadOnly,
 *   DeploymentElementToolbar,
 *   DefaultHandles,
 * } from '@likec4/diagram/custom'
 *
 * const CustomDeploymentNode = deploymentNode(({ nodeProps, nodeModel }) => (
 *   <ElementNodeContainer nodeProps={nodeProps}>
 *     <ElementShape {...nodeProps} />
 *     <ElementData {...nodeProps} />
 *     <DeploymentElementActions
 *       {...nodeProps}
 *       extraButtons={[
 *         {
 *           key: 'plus',
 *           icon: <IconPlus />,
 *           onClick: () => console.log('extra'),
 *         },
 *       ]}
 *     />
 *     <ElementDetailsButtonWithHandler {...nodeProps} />
 *     <IfNotReadOnly>
 *       <DeploymentElementToolbar {...nodeProps} />
 *     </IfNotReadOnly>
 *     <DefaultHandles />
 *   </ElementNodeContainer>
 * ))
 * ```
 */
function deploymentNode(component) {
    return customDiagramNode(component);
}
/**
 * Node that will be used to render the compound element from the model.
 * It is a container node, i.e. it has children.
 *
 * Custom node renderer receives these props:
 * - `nodeProps`: props from XYFlow
 * - `nodeModel`: LikeC4 {@link NodeModel.WithElement}
 *
 * @see [Default implementation](https://github.com/likec4/likec4/blob/main/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx)
 *
 * @example
 * ```tsx
 * import {
 *   compoundElementNode,
 *   CompoundNodeContainer,
 *   CompoundTitle,
 *   CompoundActions,
 *   CompoundDetailsButtonWithHandler,
 *   IfEnabled,
 *   CompoundElementToolbar,
 *   DefaultHandles,
 * } from '@likec4/diagram/custom'
 *
 * const CustomCompoundElementNode = compoundElementNode(({ nodeProps, nodeModel }) => (
 *   <CompoundNodeContainer nodeProps={props}>
 *     <CompoundTitle {...props} />
 *     <CompoundActions {...props} />
 *     <IfEnabled feature="ElementDetails">
 *       <CompoundDetailsButtonWithHandler {...props} />
 *     </IfEnabled>
 *     <IfNotReadOnly>
 *       <CompoundElementToolbar {...props} />
 *     </IfNotReadOnly>
 *     <DefaultHandles />
 *   </CompoundNodeContainer>
 * ))
 * ```
 */
function compoundElementNode(component) {
    return customDiagramNode(component);
}
/**
 * Node that will be used to render the compound from the deployment model.
 * It is a container node, i.e. it has children.
 *
 * Custom node renderer receives these props:
 * - `nodeProps`: props from XYFlow
 * - `nodeModel`: LikeC4 {@link NodeModel.WithDeploymentElement}
 *
 * @see [Default implementation](https://github.com/likec4/likec4/blob/main/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx)
 *
 * @example
 * ```tsx
 * import {
 *   compoundDeploymentNode,
 *   CompoundNodeContainer,
 *   CompoundTitle,
 *   CompoundActions,
 *   CompoundDeploymentToolbar,
 *   DefaultHandles,
 * } from '@likec4/diagram/custom'
 *
 * const CustomCompoundDeploymentNode = compoundDeploymentNode(({ nodeProps, nodeModel }) => (
 *   <CompoundNodeContainer nodeProps={nodeProps}>
 *     <CompoundTitle {...nodeProps} />
 *     <CompoundActions {...nodeProps} />
 *     <IfNotReadOnly>
 *       <CompoundDeploymentToolbar {...nodeProps} />
 *     </IfNotReadOnly>
 *     <DefaultHandles />
 *   </CompoundNodeContainer>
 * ```
 */
function compoundDeploymentNode(component) {
    return customDiagramNode(component);
}
/**
 * Node that will be used to render the view group from the model.
 *
 * Custom node renderer receives these props:
 * - `nodeProps`: props from XYFlow
 * - `nodeModel`: LikeC4 {@link NodeModel.IsGroup}
 *
 * @see [Default implementation](https://github.com/likec4/likec4/blob/main/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx)
 *
 * @example
 * ```tsx
 * import {
 *   viewGroupNode,
 *   CompoundNodeContainer,
 *   CompoundTitle,
 *   DefaultHandles,
 * } from '@likec4/diagram/custom'
 *
 * const CustomViewGroupNode = viewGroupNode(({ nodeProps, nodeModel }) => (
 *   <CompoundNodeContainer nodeProps={nodeProps}>
 *     <CompoundTitle {...nodeProps} />
 *     <DefaultHandles />
 *   </CompoundNodeContainer>
 * ```
 */
function viewGroupNode(component) {
    return customDiagramNode(component);
}
function sequenceActorNode(component) {
    return customDiagramNode(component);
}
