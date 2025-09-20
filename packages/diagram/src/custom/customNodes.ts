import type { DeployedInstanceModel, DeploymentNodeModel, NodeModel } from '@likec4/core/model'
import type { aux } from '@likec4/core/types'
import type { FC, FunctionComponent } from 'react'
import type { Types } from '../likec4diagram/types'

type Any = aux.Any
type Unknown = aux.UnknownLayouted

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
 *   ElementTitle,
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
 *     <ElementTitle {...nodeProps} />
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
export function elementNode<A extends Any = Unknown>(
  component: FC<CustomElementNodeProps<A>>,
): FC<CustomElementNodeProps<A>> {
  return component
}
export type CustomElementNodeProps<A extends Any> = {
  nodeProps: Types.NodeProps['element']
  nodeModel: NodeModel.WithElement<A>
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
 *   ElementTitle,
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
 *     <ElementTitle {...nodeProps} />
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
export function deploymentNode<A extends Any = Unknown>(
  component: FC<CustomDeploymentNodeProps<A>>,
): FC<CustomDeploymentNodeProps<A>> {
  return component
}
export type CustomDeploymentNodeProps<A extends Any> = {
  nodeProps: Types.NodeProps['deployment']
  nodeModel: NodeModel.WithDeploymentElement<A>
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
export function compoundElementNode<A extends Any = Unknown>(
  component: FC<CustomCompoundElementNodeProps<A>>,
): FC<CustomCompoundElementNodeProps<A>> {
  return component
}
export type CustomCompoundElementNodeProps<A extends Any = Unknown> = {
  nodeProps: Types.NodeProps['compound-element']
  nodeModel: NodeModel.WithElement<A>
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
export function compoundDeploymentNode<A extends Any = Unknown>(
  component: FC<CustomCompoundDeploymentNodeProps<A>>,
): FC<CustomCompoundDeploymentNodeProps<A>> {
  return component
}
export type CustomCompoundDeploymentNodeProps<A extends Any = Unknown> = {
  nodeProps: Types.NodeProps['compound-deployment']
  nodeModel: NodeModel.WithDeploymentElement<A>
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
export function viewGroupNode<A extends Any = Unknown>(
  component: FC<CustomViewGroupNodeProps<A>>,
): FC<CustomViewGroupNodeProps<A>> {
  return component
}
export type CustomViewGroupNodeProps<A extends Any = Unknown> = {
  nodeProps: Types.NodeProps['view-group']
  nodeModel: NodeModel.IsGroup<A>
}

// export function sequenceActorNode<A extends Any = Unknown>(component: FC<CustomSequenceActorNodeProps<A>>): Types.Components['seq-actor'] {
//   return customDiagramNode(component)
// }
// export type CustomSequenceActorNodeProps<A extends Any = Unknown> = {
//   nodeProps: Types.NodeProps['seq-actor']
//   nodeModel: NodeModel.WithElement<A>
// }

export interface CustomNodes<A extends Any = Unknown> {
  element?: FunctionComponent<CustomElementNodeProps<A>>
  deployment?: FunctionComponent<CustomDeploymentNodeProps<A>>
  compoundElement?: FunctionComponent<CustomCompoundElementNodeProps<A>>
  compoundDeployment?: FunctionComponent<CustomCompoundDeploymentNodeProps<A>>
  viewGroup?: FunctionComponent<CustomViewGroupNodeProps<A>>
  // sequenceActor?: FunctionComponent<CustomSequenceActorNodeProps<A>>
}
