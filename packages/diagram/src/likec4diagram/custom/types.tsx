import type { AnyAux, NodeModel } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import type { ReactNode } from 'react'
import { customNode } from '../../base/primitives'
import type { NodeProps } from '../../base/types'
import { useLikeC4ViewModel } from '../../hooks/useCurrentViewId'
import type { Types } from '../types'

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
export const elementNode = customDiagramNode<CustomElementNodeProps>

export type CustomDeploymentNodeProps<M extends AnyAux = AnyAux> = {
  nodeProps: NodeProps<Types.DeploymentElementNodeData, 'deployment'>
  nodeModel: NodeModel.WithDeploymentElement<M, DiagramView>
}
export const deploymentNode = customDiagramNode<CustomDeploymentNodeProps>

export type CustomCompoundElementNodeProps<M extends AnyAux = AnyAux> = {
  nodeProps: NodeProps<Types.CompoundElementNodeData, 'compound-element'>
  nodeModel: NodeModel.WithElement<M, DiagramView>
}
export const compoundElementNode = customDiagramNode<CustomCompoundElementNodeProps>

export type CustomCompoundDeploymentNodeProps<M extends AnyAux = AnyAux> = {
  nodeProps: NodeProps<Types.CompoundDeploymentNodeData, 'compound-deployment'>
  nodeModel: NodeModel.WithDeploymentElement<M, DiagramView>
}
export const compoundDeploymentNode = customDiagramNode<CustomCompoundDeploymentNodeProps>

export type CustomViewGroupNodeProps<M extends AnyAux = AnyAux> = {
  nodeProps: NodeProps<Types.ViewGroupNodeData, 'view-group'>
  nodeModel: NodeModel.IsGroup<M, DiagramView>
}
export const viewGroupNode = customDiagramNode<CustomViewGroupNodeProps>

export type CustomNodes = {
  element?: undefined | ((props: NodeProps<Types.ElementNodeData, 'element'>) => ReactNode)
  deployment?: undefined | ((props: NodeProps<Types.DeploymentElementNodeData, 'deployment'>) => ReactNode)
  compoundElement?: undefined | ((props: NodeProps<Types.CompoundElementNodeData, 'compound-element'>) => ReactNode)
  compoundDeployment?:
    | undefined
    | ((props: NodeProps<Types.CompoundDeploymentNodeData, 'compound-deployment'>) => ReactNode)
  viewGroup?: undefined | ((props: NodeProps<Types.ViewGroupNodeData, 'view-group'>) => ReactNode)
}
