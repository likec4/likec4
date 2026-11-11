import { nonexhaustive } from '@likec4/core'
import type { NodeModel } from '@likec4/core/model'
import type { aux, NodeId, ViewId } from '@likec4/core/types'
import type { FC, FunctionComponent } from 'react'
import { capitalize, toCamelCase } from 'remeda'
import type { BaseNodePropsWithData } from '../base/types'
import { useLikeC4Model } from '../hooks/useLikeC4Model'
import type { NodeRenderers } from '../LikeC4Diagram.props'
import type { Types } from '../likec4diagram/types'
import * as BuiltinNodes from './builtins'

type Any = aux.Any
type Unknown = aux.UnknownLayouted

/**
 * Base props required for all custom node renderers
 */
type RequiredNodeProps = BaseNodePropsWithData<{
  id: NodeId
  viewId: ViewId
}>

/**
 * Props passed to custom node components
 * @template P - The node props type
 */
interface CustomDiagramNodeProps<
  P extends RequiredNodeProps,
> {
  nodeProps: P
  nodeModel: NodeModel
}

/**
 * Internal helper that wraps a custom node component with model lookup logic.
 * Resolves the node model from the LikeC4 model based on the node's view ID and ID.
 *
 * @param Node - The custom node component to wrap
 * @returns A wrapped component that accepts XYFlow node props
 */
function customDiagramNode<
  NP extends RequiredNodeProps,
>(
  Node: FunctionComponent<CustomDiagramNodeProps<NP>>,
): FunctionComponent<NP> {
  return ((props: NP) => {
    const viewId = props.data.viewId
    const likec4 = useLikeC4Model()
    const viewModel = likec4.findView(viewId)
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
    return <Node nodeProps={props} nodeModel={model} />
  })
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
 * } from 'likec4/react'
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
export function elementNode<A extends Any = Unknown>(
  component: FC<ElementNodeProps<A>>,
): Types.NodeRenderer<'element'> {
  return customDiagramNode(component as any)
}

/**
 * Props passed to custom element node renderers
 * @template A - The aux type for the model
 */
export type ElementNodeProps<A extends Any = Unknown> = {
  nodeProps: Types.NodeProps<'element'>
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
 *   ElementData,
 *   DeploymentElementActions,
 *   ElementDetailsButtonWithHandler,
 *   IfNotReadOnly,
 *   DeploymentElementToolbar,
 *   DefaultHandles,
 * } from 'likec4/react'
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
export function deploymentNode<A extends Any = Unknown>(
  component: FC<DeploymentNodeProps<A>>,
): Types.NodeRenderer<'deployment'> {
  return customDiagramNode(component as any)
}

/**
 * Props passed to custom deployment node renderers
 * @template A - The aux type for the model
 */
export type DeploymentNodeProps<A extends Any = Unknown> = {
  nodeProps: Types.NodeProps<'deployment'>
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
 * } from 'likec4/react'
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
  component: FC<CompoundElementNodeProps<A>>,
): Types.NodeRenderer<'compound-element'> {
  return customDiagramNode(component as any)
}

/**
 * Props passed to custom compound element node renderers
 * @template A - The aux type for the model
 */
export type CompoundElementNodeProps<A extends Any = Unknown> = {
  nodeProps: Types.NodeProps<'compound-element'>
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
 * } from 'likec4/react'
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
  component: FC<CompoundDeploymentNodeProps<A>>,
): Types.NodeRenderer<'compound-deployment'> {
  return customDiagramNode(component as any)
}

/**
 * Props passed to custom compound deployment node renderers
 * @template A - The aux type for the model
 */
export type CompoundDeploymentNodeProps<A extends Any = Unknown> = {
  nodeProps: Types.NodeProps<'compound-deployment'>
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
 * } from 'likec4/react'
 *
 * const CustomViewGroupNode = viewGroupNode(({ nodeProps, nodeModel }) => (
 *   <CompoundNodeContainer nodeProps={nodeProps}>
 *     <CompoundTitle {...nodeProps} />
 *     <DefaultHandles />
 *   </CompoundNodeContainer>
 * ```
 */
export function viewGroupNode<A extends Any = Unknown>(
  component: FC<ViewGroupNodeProps<A>>,
): Types.NodeRenderer<'view-group'> {
  return customDiagramNode(component as any)
}

/**
 * Props passed to custom view group node renderers
 * @template A - The aux type for the model
 */
export type ViewGroupNodeProps<A extends Any = Unknown> = {
  nodeProps: Types.NodeProps<'view-group'>
  nodeModel: NodeModel.IsGroup<A>
}

/**
 * Node that will be used to render the sequence actor from the model.
 *
 * Custom node renderer receives these props:
 * - `nodeProps`: props from XYFlow
 * - `nodeModel`: LikeC4 {@link NodeModel.WithElement}
 *
 * @see [Default implementation](https://github.com/likec4/likec4/blob/main/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx)
 */
export function sequenceActorNode<A extends Any = Unknown>(
  component: FC<SequenceActorNodeProps<A>>,
): Types.NodeRenderer<'seq-actor'> {
  return customDiagramNode(component as any)
}

/**
 * Props passed to custom sequence actor node renderers
 * @template A - The aux type for the model
 */
export type SequenceActorNodeProps<A extends Any = Unknown> = {
  nodeProps: Types.NodeProps<'seq-actor'>
  nodeModel: NodeModel.WithElement<A>
}

/**
 * Helper function to define custom node renderers
 *
 * @example
 * ```tsx
 * import { defineNode, ElementNodeContainer, ElementTitle, DefaultHandles } from 'likec4/react'
 *
 * const CustomElementNode = defineNode('element', (nodeProps) => (
 *   <ElementNodeContainer nodeProps={nodeProps}>
 *     <ElementTitle {...nodeProps} />
 *     <DefaultHandles />
 *   </ElementNodeContainer>
 * ))
 * ```
 * Or using bound methods:
 *
 * @example
 * ```tsx
 * import { defineNode, ElementNodeContainer, ElementTitle, DefaultHandles } from 'likec4/react'
 *
 * const CustomElementNode = defineNode.element((nodeProps) => (
 *   <ElementNodeContainer {...nodeProps}>
 *     <ElementTitle {...nodeProps} />
 *     <DefaultHandles />
 *   </ElementNodeContainer>
 * ))
 * ```
 */
function defineNode<T extends Types.NodeType>(
  nodeType: T,
  renderer: Types.NodeRenderer<T>,
): Types.NodeRenderer<T> {
  const defined = (props: Types.NodeProps<T>) => {
    if (props.type !== nodeType) {
      throw new Error(`Expected node type '${nodeType}', got '${props.type}'`)
    }
    return renderer(props)
  }
  defined.displayName = `Defined${toCamelCase(nodeType)}`
  return defined
}

/**
 * Factory type for creating bound node renderers for a specific node type
 * @template T - The node type
 */
type NodeRendererFactory<T extends Types.NodeType> = (renderer: Types.NodeRenderer<T>) => Types.NodeRenderer<T>

/**
 * Factory method for defining custom element node renderers
 *
 * @see [Default implementation](https://github.com/likec4/likec4/blob/main/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx) as reference
 *
 * @example
 * ```tsx
 * import { defineNode, ElementNodeContainer, ElementTitle, DefaultHandles } from 'likec4/react'
 *
 * const CustomElementNode = defineNode.element((nodeProps) => (
 *   <ElementNodeContainer {...nodeProps}>
 *     <ElementTitle {...nodeProps} />
 *     <DefaultHandles />
 *   </ElementNodeContainer>
 * ))
 * ```
 */
defineNode.element = defineNode.bind(null, 'element') as NodeRendererFactory<'element'>

/**
 * Factory method for defining custom deployment node renderers
 *
 * @see [Default implementation](https://github.com/likec4/likec4/blob/main/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx) as reference
 *
 * @example
 * ```tsx
 * import { defineNode, ElementNodeContainer, ElementTitle, DefaultHandles } from 'likec4/react'
 *
 * const CustomDeploymentNode = defineNode.deploymentNode((nodeProps) => (
 *   <ElementNodeContainer {...nodeProps}>
 *     <ElementTitle {...nodeProps} />
 *     <DefaultHandles />
 *   </ElementNodeContainer>
 * ))
 * ```
 */
defineNode.deploymentNode = defineNode.bind(null, 'deployment') as NodeRendererFactory<'deployment'>

/**
 * Factory method for defining custom compound element node renderers
 *
 * @see [Default implementation](https://github.com/likec4/likec4/blob/main/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx) as reference
 *
 * @example
 * ```tsx
 * import { defineNode, CompoundNodeContainer, CompoundTitle, DefaultHandles } from 'likec4/react'
 *
 * const CustomCompoundElementNode = defineNode.compoundElement((nodeProps) => (
 *   <CompoundNodeContainer {...nodeProps}>
 *     <CompoundTitle {...nodeProps} />
 *     <DefaultHandles />
 *   </CompoundNodeContainer>
 * ))
 * ```
 */
defineNode.compoundElement = defineNode.bind(null, 'compound-element') as NodeRendererFactory<'compound-element'>

/**
 * Factory method for defining custom compound deployment node renderers
 *
 * @see [Default implementation](https://github.com/likec4/likec4/blob/main/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx) as reference
 *
 * @example
 * ```tsx
 * import { defineNode, CompoundNodeContainer, CompoundTitle, DefaultHandles } from 'likec4/react'
 *
 * const CustomCompoundDeploymentNode = defineNode.compoundDeployment((nodeProps) => (
 *   <CompoundNodeContainer {...nodeProps}>
 *     <CompoundTitle {...nodeProps} />
 *     <DefaultHandles />
 *   </CompoundNodeContainer>
 * ))
 * ```
 */
defineNode.compoundDeployment = defineNode.bind(null, 'compound-deployment') as NodeRendererFactory<
  'compound-deployment'
>

/**
 * Factory method for defining custom view group node renderers
 *
 * @see [Default implementation](https://github.com/likec4/likec4/blob/main/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx) as reference
 *
 * @example
 * ```tsx
 * import { defineNode, CompoundNodeContainer, CompoundTitle, DefaultHandles } from 'likec4/react'
 *
 * const CustomViewGroupNode = defineNode.viewGroup((nodeProps) => (
 *   <CompoundNodeContainer {...nodeProps}>
 *     <CompoundTitle {...nodeProps} />
 *     <DefaultHandles />
 *   </CompoundNodeContainer>
 * ))
 * ```
 */
defineNode.viewGroup = defineNode.bind(null, 'view-group') as NodeRendererFactory<'view-group'>

/**
 * Factory method for defining custom sequence actor node renderers
 *
 * @see [Default implementation](https://github.com/likec4/likec4/blob/main/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx) as reference
 *
 * @example
 * ```tsx
 * import { defineNode, SequenceActorContainer, SequenceActorTitle } from 'likec4/react'
 *
 * const CustomSequenceActorNode = defineNode.seqActor((nodeProps) => (
 *   <SequenceActorContainer {...nodeProps}>
 *     <SequenceActorTitle {...nodeProps} />
 *   </SequenceActorContainer>
 * ))
 * ```
 */
defineNode.seqActor = defineNode.bind(null, 'seq-actor') as NodeRendererFactory<'seq-actor'>

/**
 * Factory method for defining custom sequence subflow node renderers
 *
 * @see [Default implementation](https://github.com/likec4/likec4/blob/main/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx) as reference
 *
 * @example
 * ```tsx
 * import { defineNode, SequenceSubflowContainer, SequenceSubflowTitle } from 'likec4/react'
 *
 * const CustomSequenceSubflowNode = defineNode.seqSubflow((nodeProps) => (
 *   <SequenceSubflowContainer {...nodeProps}>
 *     <SequenceSubflowTitle {...nodeProps} />
 *   </SequenceSubflowContainer>
 * ))
 * ```
 */
defineNode.seqSubflow = defineNode.bind(null, 'seq-subflow') as NodeRendererFactory<'seq-subflow'>

export { defineNode }

/**
 * Helper function to define custom node renderers
 *
 * @example
 * ```tsx
 * import { defineNodes, ElementNodeContainer, ElementTitle, DefaultHandles } from 'likec4/react'
 *
 * const CustomNodes = defineNodes({
 *   element: (nodeProps) => (
 *     <ElementNodeContainer {...nodeProps}>
 *       <ElementTitle {...nodeProps} />
 *       <DefaultHandles />
 *     </ElementNodeContainer>
 *   ),
 *   deployment: (nodeProps) => (
 *     <DeploymentNodeContainer {...nodeProps}>
 *       <DeploymentTitle {...nodeProps} />
 *       <DefaultHandles />
 *     </DeploymentNodeContainer>
 *   ),
 * })
 * ```
 *
 * {@link defineNode}
 */
export function defineNodes<T extends NodeRenderers>(renderers: T): T {
  return renderers
}

/**
 * Helper function to get the default node renderer for a given node type
 *
 * @param type - The node type to get the default renderer for
 * @returns The default node renderer for the specified type
 */
export function defaultNodeRenderer<T extends Types.NodeType>(type: T): Types.NodeRenderer<T> {
  switch (type) {
    case 'element':
      return BuiltinNodes.ElementNode as Types.NodeRenderer<T>
    case 'deployment':
      return BuiltinNodes.DeploymentNode as Types.NodeRenderer<T>
    case 'compound-element':
      return BuiltinNodes.CompoundElementNode as Types.NodeRenderer<T>
    case 'compound-deployment':
      return BuiltinNodes.CompoundDeploymentNode as Types.NodeRenderer<T>
    case 'view-group':
      return BuiltinNodes.ViewGroupNode as Types.NodeRenderer<T>
    case 'seq-actor':
      return BuiltinNodes.SequenceActorNode as Types.NodeRenderer<T>
    case 'seq-parallel':
      return BuiltinNodes.SequenceParallelArea as Types.NodeRenderer<T>
    case 'seq-subflow':
      return BuiltinNodes.SequenceSubflowArea as Types.NodeRenderer<T>
    case 'graph-element':
      return BuiltinNodes.GraphElementNode as Types.NodeRenderer<T>
    default:
      return nonexhaustive(type)
  }
}

/**
 * Component type for wrapping node renderers
 * @template P - The node props type
 */
type NodeWrapper<P extends Types.NodeProps<any>> = FC<{
  /**
   * Original node props
   */
  props: P
  /**
   * Node renderer to wrap
   */
  Node: Types.NodeRenderer<P['type']>
}>

/**
 * Helper function to wrap a node renderer with a custom wrapper component
 *
 * @example
 * ```tsx
 * import { wrapNode } from 'likec4/react'
 *
 * const WrappedElementNode = wrapNode('element', ({ props, Node }) => (
 *   <div className="custom-wrapper">
 *     <Node {...props} />
 *   </div>
 * ))
 * ```
 *
 * @param nodeType - The node type to wrap
 * @param Wrapper - The wrapper component
 * @returns A wrapped node renderer
 */
export function wrapNode<T extends Types.NodeType>(
  nodeType: T,
  Wrapper: NodeWrapper<Types.NodeProps<T>>,
): Types.NodeRenderer<T> {
  const wrapped = ((props: Types.NodeProps<T>) => {
    if (props.type !== nodeType) {
      throw new Error(`Expected node type '${nodeType}', got '${props.type}'`)
    }
    return <Wrapper props={props} Node={defaultNodeRenderer(props.type)} />
  }) as Types.NodeRenderer<T>
  wrapped.displayName = `Wrapped${capitalize(toCamelCase(nodeType))}`
  return wrapped
}

/**
 * Factory type for creating bound node wrappers for a specific node type
 * @template T - The node type
 */
type BoundWrapper<T extends Types.NodeType> = (wrapper: NodeWrapper<Types.NodeProps<T>>) => Types.NodeRenderer<T>

/**
 * Factory method for wrapping element node renderers
 *
 * @example
 * ```tsx
 * import { wrapNode } from 'likec4/react'
 *
 * const WrappedElementNode = wrapNode.element(({ props, Node }) => (
 *   <div className="custom-wrapper">
 *     <Node {...props} />
 *   </div>
 * ))
 * ```
 */
wrapNode.element = wrapNode.bind(null, 'element') as BoundWrapper<'element'>

/**
 * Factory method for wrapping deployment node renderers
 *
 * @example
 * ```tsx
 * import { wrapNode } from 'likec4/react'
 *
 * const WrappedDeploymentNode = wrapNode.deployment(({ props, Node }) => (
 *   <div className="custom-wrapper">
 *     <Node {...props} />
 *   </div>
 * ))
 * ```
 */
wrapNode.deployment = wrapNode.bind(null, 'deployment') as BoundWrapper<'deployment'>

/**
 * Factory method for wrapping compound element node renderers
 *
 * @example
 * ```tsx
 * import { wrapNode } from 'likec4/react'
 *
 * const WrappedCompoundElementNode = wrapNode.compoundElement(({ props, Node }) => (
 *   <div className="custom-wrapper">
 *     <Node {...props} />
 *   </div>
 * ))
 * ```
 */
wrapNode.compoundElement = wrapNode.bind(null, 'compound-element') as BoundWrapper<'compound-element'>

/**
 * Factory method for wrapping compound deployment node renderers
 *
 * @example
 * ```tsx
 * import { wrapNode } from 'likec4/react'
 *
 * const WrappedCompoundDeploymentNode = wrapNode.compoundDeployment(({ props, Node }) => (
 *   <div className="custom-wrapper">
 *     <Node {...props} />
 *   </div>
 * ))
 * ```
 */
wrapNode.compoundDeployment = wrapNode.bind(null, 'compound-deployment') as BoundWrapper<'compound-deployment'>

/**
 * Factory method for wrapping view group node renderers
 *
 * @example
 * ```tsx
 * import { wrapNode } from 'likec4/react'
 *
 * const WrappedViewGroupNode = wrapNode.viewGroup(({ props, Node }) => (
 *   <div className="custom-wrapper">
 *     <Node {...props} />
 *   </div>
 * ))
 * ```
 */
wrapNode.viewGroup = wrapNode.bind(null, 'view-group') as BoundWrapper<'view-group'>

/**
 * Factory method for wrapping sequence actor node renderers
 *
 * @example
 * ```tsx
 * import { wrapNode } from 'likec4/react'
 *
 * const WrappedSequenceActorNode = wrapNode.seqActor(({ props, Node }) => (
 *   <div className="custom-wrapper">
 *     <Node {...props} />
 *   </div>
 * ))
 * ```
 */
wrapNode.seqActor = wrapNode.bind(null, 'seq-actor') as BoundWrapper<'seq-actor'>

/**
 * Factory method for wrapping sequence subflow area node renderers
 *
 * @example
 * ```tsx
 * import { wrapNode } from 'likec4/react'
 *
 * const WrappedSequenceSubflowNode = wrapNode.seqSubflow(({ props, Node }) => (
 *   <div className="custom-wrapper">
 *     <Node {...props} />
 *   </div>
 * ))
 * ```
 */
wrapNode.seqSubflow = wrapNode.bind(null, 'seq-subflow') as BoundWrapper<'seq-subflow'>

/**
 * Factory method for wrapping graph element node renderers
 *
 * @example
 * ```tsx
 * import { wrapNode } from 'likec4/react'
import { toCamelCase } from 'remeda'
 *
 * const WrappedGraphElementNode = wrapNode.graphElement(({ props, Node }) => (
 *   <div className="custom-wrapper">
 *     <Node {...props} />
 *   </div>
 * ))
 * ```
 */
wrapNode.graphElement = wrapNode.bind(null, 'graph-element') as BoundWrapper<'graph-element'>
