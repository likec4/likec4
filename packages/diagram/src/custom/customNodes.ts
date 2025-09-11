import type { DeployedInstanceModel, DeploymentNodeModel, NodeModel } from '@likec4/core/model'
import type { aux } from '@likec4/core/types'
import type { FunctionComponent } from 'react'
import { jsx } from 'react/jsx-runtime'
import { customNode } from '../base/primitives'
import type { NodeProps } from '../base/types'
import type { Types } from '../likec4diagram/types'
import { useLikeC4ViewModel } from '../likec4model/useLikeC4Model'

type Any = aux.Any

type CustomDiagramNodeProps = {
  nodeProps: NodeProps<Types.NodeData, string>
  nodeModel: NodeModel
}
type CustomNodeComponent<P extends CustomDiagramNodeProps> = (
  impl: FunctionComponent<P>,
) => FunctionComponent<P['nodeProps']>

function customDiagramNode<const P extends CustomDiagramNodeProps>(
  Node: FunctionComponent<P>,
): FunctionComponent<P['nodeProps']> {
  return customNode((props: NodeProps<Types.NodeData, string>) => {
    // @ts-ignore because dts-bundler fails to infer types
    const viewId = props.data.viewId
    const viewModel = useLikeC4ViewModel(viewId)
    if (!viewModel) {
      console.error(`View "${viewId}" not found, requested by customNode "${props.data.id}"`, { props })
      return null
    }
    const model = viewModel.findNode(props.data.id)
    if (!model) {
      console.error(
        `Node "${props.id}" not found in view "${viewId}", requested by customNode "${props.data.id}"`,
        { props },
      )
      return null
    }
    return jsx(Node, { nodeProps: props, nodeModel: model })
  }) as any
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
export const elementNode: CustomNodeComponent<CustomElementNodeProps> = customDiagramNode as any
export type CustomElementNodeProps = {
  nodeProps: NodeProps<Types.ElementNodeData, 'element'>
  nodeModel: NodeModel.WithElement<Any>
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
export const deploymentNode: CustomNodeComponent<CustomDeploymentNodeProps> = customDiagramNode as any
export type CustomDeploymentNodeProps = {
  nodeProps: NodeProps<Types.DeploymentElementNodeData, 'deployment'>
  nodeModel: NodeModel.WithDeploymentElement<Any>
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
export const compoundElementNode: CustomNodeComponent<CustomCompoundElementNodeProps> = customDiagramNode as any
export type CustomCompoundElementNodeProps = {
  nodeProps: NodeProps<Types.CompoundElementNodeData, 'compound-element'>
  nodeModel: NodeModel.WithElement<Any>
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
export const compoundDeploymentNode: CustomNodeComponent<CustomCompoundDeploymentNodeProps> = customDiagramNode as any
export type CustomCompoundDeploymentNodeProps = {
  nodeProps: NodeProps<Types.CompoundDeploymentNodeData, 'compound-deployment'>
  nodeModel: NodeModel.WithDeploymentElement<Any>
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
export const viewGroupNode: CustomNodeComponent<CustomViewGroupNodeProps> = customDiagramNode as any
export type CustomViewGroupNodeProps = {
  nodeProps: NodeProps<Types.ViewGroupNodeData, 'view-group'>
  nodeModel: NodeModel.IsGroup<Any>
}

export const sequenceActorNode: CustomNodeComponent<CustomSequenceActorNodeProps> = customDiagramNode as any
export type CustomSequenceActorNodeProps = {
  nodeProps: NodeProps<Types.SequenceActorNodeData, 'seq-actor'>
  nodeModel: NodeModel.WithElement<Any>
}

export interface CustomNodes {
  element?: FunctionComponent<NodeProps<Types.ElementNodeData, 'element'>>
  deployment?: FunctionComponent<NodeProps<Types.DeploymentElementNodeData, 'deployment'>>
  compoundElement?: FunctionComponent<NodeProps<Types.CompoundElementNodeData, 'compound-element'>>
  compoundDeployment?: FunctionComponent<NodeProps<Types.CompoundDeploymentNodeData, 'compound-deployment'>>
  viewGroup?: FunctionComponent<NodeProps<Types.ViewGroupNodeData, 'view-group'>>
  sequenceActor?: FunctionComponent<NodeProps<Types.SequenceActorNodeData, 'seq-actor'>>
}
