import { type FunctionComponent, memo } from 'react'
import type { NodeProps } from '../../../base'
import { nodePropsEqual } from '../../../base/primitives/customNode'
import { type EnabledFeatures, useEnabledFeatures } from '../../../context/DiagramFeatures'
import type { Types } from '../../types'

export type CustomNodeProps<T extends Types.Node['type']> = {
  nodeProps: NodeProps<Extract<Types.Node, { type: T }>['data'], T>
  features: EnabledFeatures
}

export function customDiagramNode<T extends Types.Node['type']>(
  Node: FunctionComponent<CustomNodeProps<T>>,
) {
  return memo((props: CustomNodeProps<T>['nodeProps']) => {
    const features = useEnabledFeatures()
    return <Node nodeProps={props} features={features} />
  }, nodePropsEqual)
}
