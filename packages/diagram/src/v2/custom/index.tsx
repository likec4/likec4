import { type NodeId, nonNullable } from '@likec4/core'
import { useMemo, useTransition } from 'react'
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
} from '../../base/primitives'
import { IfEnabled } from '../../context'
import { useDiagramActor } from '../hooks'
import type { Types } from '../types'
import { CompoundActions } from './CompoundActions'
import { DeploymentElementActions } from './DeploymentElementActions'
import { ElementActions } from './ElementActions'
import { RelationshipEdge } from './RelationshipEdge'

export function useNodeTypes() {
  const { send } = useDiagramActor()
  const [, startTransition] = useTransition()
  return useMemo(() => ({
    element: customNode<Types.ElementNodeData>((props) => (
      <ElementNodeContainer {...props}>
        <ElementShape {...props} />
        <ElementTitle {...props} />
        <ElementActions {...props} />
        <IfEnabled feature="ElementDetails">
          <ElementDetailsButton
            {...props}
            onClick={e => {
              e.stopPropagation()
              const event = {
                type: 'openElementDetails' as const,
                fqn: props.data.fqn,
                fromNode: props.id as NodeId,
              }
              startTransition(() => send(event))
            }} />
        </IfEnabled>
        <DefaultHandles />
      </ElementNodeContainer>
    )),
    deployment: customNode<Types.DeploymentElementNodeData>((props) => (
      <ElementNodeContainer {...props}>
        <ElementShape {...props} />
        <ElementTitle {...props} />
        <DeploymentElementActions {...props} />
        <IfEnabled feature="ElementDetails" and={!!props.data.modelRef}>
          <ElementDetailsButton
            {...props}
            onClick={e => {
              e.stopPropagation()
              const fqn = nonNullable(props.data.modelRef)
              const event = {
                type: 'openElementDetails' as const,
                fqn,
                fromNode: props.id as NodeId,
              }
              startTransition(() => send(event))
            }} />
        </IfEnabled>
        <DefaultHandles />
      </ElementNodeContainer>
    )),
    'compound-element': customNode<Types.CompoundElementNodeData>((props) => (
      <CompoundNodeContainer {...props}>
        <CompoundTitle {...props} />
        <CompoundActions {...props} />
        <IfEnabled feature="ElementDetails">
          <CompoundDetailsButton
            {...props}
            onClick={e => {
              e.stopPropagation()
              const event = {
                type: 'openElementDetails' as const,
                fqn: props.data.fqn,
                fromNode: props.id as NodeId,
              }
              startTransition(() => send(event))
            }} />
        </IfEnabled>
        <DefaultHandles />
      </CompoundNodeContainer>
    )),
    'compound-deployment': customNode<Types.CompoundDeploymentNodeData>((props) => (
      <CompoundNodeContainer {...props}>
        <CompoundTitle {...props} />
        <DefaultHandles />
      </CompoundNodeContainer>
    )),
    'view-group': customNode<Types.ViewGroupNodeData>((props) => (
      <CompoundNodeContainer {...props}>
        <CompoundTitle {...props} />
        <DefaultHandles />
      </CompoundNodeContainer>
    )),
  } satisfies { [key in Types.Node['type']]: any }), [])
}

export function useEdgeTypes() {
  return useMemo(() => ({
    relationship: RelationshipEdge,
  } satisfies { [key in Types.Edge['type']]: any }), [])
}
