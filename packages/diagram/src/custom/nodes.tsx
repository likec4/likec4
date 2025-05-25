import type { AnyAux, DeployedInstanceModel, DeploymentNodeModel, NodeModel } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import type { ReactNode } from 'react'
import { customNode } from '../base/primitives'
import type { NodeProps } from '../base/types'
import { useLikeC4ViewModel } from '../hooks/useCurrentViewId'
import type { Types } from '../likec4diagram/types'

function customDiagramNode<
  P extends {
    nodeProps: any
    nodeModel: any
  },
>(
  Node: (props: P) => ReactNode,
): (props: P['nodeProps']) => ReactNode {
  return customNode((props) => {
    const viewModel = useLikeC4ViewModel()
    const model = viewModel.node(props.id)
    // @ts-ignore
    return <Node nodeProps={props} nodeModel={model} />
  }) as (props: P['nodeProps']) => ReactNode
}

export type CustomElementNodeProps<M extends AnyAux = AnyAux> = {
  nodeProps: NodeProps<Types.ElementNodeData, 'element'>
  nodeModel: NodeModel.WithElement<M, DiagramView>
}
/**
 * Node that will be used to render the element from the model.
 * It is a leaf node, i.e. it does not have children.
 *
 * Custom node renderer receives these props:
 * - `nodeProps`: props from XYFlow
 * - `nodeModel`: LikeC4 {@link NodeModel.WithElement}
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
 *   IfNotReadOnly,
 *   ElementToolbar,
 *   DefaultHandles,
 * } from '@likec4/diagram/custom'
 *
 * const CustomElementNode = elementNode(({ nodeProps, nodeModel }) => (
 *   <ElementNodeContainer nodeProps={nodeProps}>
 *     <ElementShape {...nodeProps} />
 *     <ElementTitle {...nodeProps} />
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
export const elementNode = customDiagramNode<CustomElementNodeProps>

export type CustomDeploymentNodeProps<M extends AnyAux = AnyAux> = {
  nodeProps: NodeProps<Types.DeploymentElementNodeData, 'deployment'>
  nodeModel: NodeModel.WithDeploymentElement<M, DiagramView>
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
export const deploymentNode = customDiagramNode<CustomDeploymentNodeProps>

export type CustomCompoundElementNodeProps<M extends AnyAux = AnyAux> = {
  nodeProps: NodeProps<Types.CompoundElementNodeData, 'compound-element'>
  nodeModel: NodeModel.WithElement<M, DiagramView>
}
/**
 * Node that will be used to render the compound element from the model.
 * It is a container node, i.e. it has children.
 *
 * Custom node renderer receives these props:
 * - `nodeProps`: props from XYFlow
 * - `nodeModel`: LikeC4 {@link NodeModel.WithElement}
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
export const compoundElementNode = customDiagramNode<CustomCompoundElementNodeProps>

export type CustomCompoundDeploymentNodeProps<M extends AnyAux = AnyAux> = {
  nodeProps: NodeProps<Types.CompoundDeploymentNodeData, 'compound-deployment'>
  nodeModel: NodeModel.WithDeploymentElement<M, DiagramView>
}
/**
 * Node that will be used to render the compound from the deployment model.
 * It is a container node, i.e. it has children.
 *
 * Custom node renderer receives these props:
 * - `nodeProps`: props from XYFlow
 * - `nodeModel`: LikeC4 {@link NodeModel.WithDeploymentElement}
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
export const compoundDeploymentNode = customDiagramNode<CustomCompoundDeploymentNodeProps>

export type CustomViewGroupNodeProps<M extends AnyAux = AnyAux> = {
  nodeProps: NodeProps<Types.ViewGroupNodeData, 'view-group'>
  nodeModel: NodeModel.IsGroup<M, DiagramView>
}
/**
 * Node that will be used to render the view group from the model.
 *
 * Custom node renderer receives these props:
 * - `nodeProps`: props from XYFlow
 * - `nodeModel`: LikeC4 {@link NodeModel.IsGroup}
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
export const viewGroupNode = customDiagramNode<CustomViewGroupNodeProps>

export interface CustomNodes {
  element?: undefined | ((props: NodeProps<Types.ElementNodeData, 'element'>) => ReactNode)
  deployment?: undefined | ((props: NodeProps<Types.DeploymentElementNodeData, 'deployment'>) => ReactNode)
  compoundElement?: undefined | ((props: NodeProps<Types.CompoundElementNodeData, 'compound-element'>) => ReactNode)
  compoundDeployment?:
    | undefined
    | ((props: NodeProps<Types.CompoundDeploymentNodeData, 'compound-deployment'>) => ReactNode)
  viewGroup?: undefined | ((props: NodeProps<Types.ViewGroupNodeData, 'view-group'>) => ReactNode)
}
