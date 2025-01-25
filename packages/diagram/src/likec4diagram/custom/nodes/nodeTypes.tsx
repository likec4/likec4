import { type Fqn, type NodeId } from '@likec4/core'
import type { NodeProps } from '../../../base'
import {
  CompoundDetailsButton,
  CompoundNodeContainer,
  CompoundTitle,
  customNode,
  DefaultHandles,
  ElementDetailsButton,
  ElementNodeContainer,
  ElementShape,
  ElementTitle,
} from '../../../base/primitives'
import { IfEnabled, IfNotEnabled, useEnabledFeature } from '../../../context'
import { useDiagram } from '../../../hooks2'
import type { Types } from '../../types'
import { CompoundActions } from './CompoundActions'
import { DeploymentElementActions, ElementActions } from './ElementActions'
import { CompoundDeploymentToolbar, CompoundElementToolbar } from './toolbar/CompoundToolbar'
import { DeploymentElementToolbar, ElementToolbar } from './toolbar/ElementToolbar'

const ElementDetailsButtonWithHandler = ({ fqn, ...props }: NodeProps<Types.NodeData> & { fqn: Fqn }) => {
  const { enableElementDetails } = useEnabledFeature('ElementDetails')
  const diagram = useDiagram()

  if (!enableElementDetails) return null

  return (
    <ElementDetailsButton
      {...props}
      onClick={e => {
        e.stopPropagation()
        diagram.openElementDetails(fqn, props.id as NodeId)
      }}
    />
  )
}

export const nodeTypes = {
  element: customNode<Types.ElementNodeData>((props) => (
    <ElementNodeContainer nodeProps={props}>
      <ElementShape {...props} />
      <ElementTitle {...props} />
      <ElementActions {...props} />
      <ElementDetailsButtonWithHandler
        fqn={props.data.modelFqn}
        {...props} />
      <IfNotEnabled feature="ReadOnly">
        <ElementToolbar {...props} />
      </IfNotEnabled>
      <DefaultHandles />
    </ElementNodeContainer>
  )),
  deployment: customNode<Types.DeploymentElementNodeData>((props) => (
    <ElementNodeContainer nodeProps={props}>
      <ElementShape {...props} />
      <ElementTitle {...props} />
      <DeploymentElementActions {...props} />
      {!!props.data.modelFqn && (
        <ElementDetailsButtonWithHandler
          fqn={props.data.modelFqn}
          {...props} />
      )}
      <IfNotEnabled feature="ReadOnly">
        <DeploymentElementToolbar {...props} />
      </IfNotEnabled>
      <DefaultHandles />
    </ElementNodeContainer>
  )),
  'compound-element': customNode<Types.CompoundElementNodeData>((props) => {
    const diagram = useDiagram()
    return (
      <CompoundNodeContainer nodeProps={props}>
        <CompoundTitle {...props} />
        <CompoundActions {...props} />
        <IfEnabled feature="ElementDetails">
          <CompoundDetailsButton
            {...props}
            onClick={e => {
              e.stopPropagation()
              diagram.openElementDetails(props.data.modelFqn, props.id as NodeId)
            }} />
        </IfEnabled>
        <IfNotEnabled feature="ReadOnly">
          <CompoundElementToolbar {...props} />
        </IfNotEnabled>
        <DefaultHandles />
      </CompoundNodeContainer>
    )
  }),
  'compound-deployment': customNode<Types.CompoundDeploymentNodeData>((props) => (
    <CompoundNodeContainer nodeProps={props}>
      <CompoundTitle {...props} />
      <CompoundActions {...props} />
      <IfNotEnabled feature="ReadOnly">
        <CompoundDeploymentToolbar {...props} />
      </IfNotEnabled>
      <DefaultHandles />
    </CompoundNodeContainer>
  )),
  'view-group': customNode<Types.ViewGroupNodeData>((props) => (
    <CompoundNodeContainer nodeProps={props}>
      <CompoundTitle {...props} />
      <DefaultHandles />
    </CompoundNodeContainer>
  )),
} satisfies { [key in Types.Node['type']]: any }
