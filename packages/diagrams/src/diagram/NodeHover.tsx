import type { KonvaNodeEvents } from 'react-konva'
import { AnimatedGroup } from '../konva'
import type { NodeSpringValues, NodeSpringsCtrl } from './springs'
import type { DiagramNode, DiagramTheme } from './types'
import { KonvaHtml } from '../konva-html'
import { BrainIcon } from './icons'

interface NodeHoverProps extends KonvaNodeEvents {
  node: DiagramNode
  theme: DiagramTheme
  springs: NodeSpringValues
  ctrl: NodeSpringsCtrl
}

export function NodeHover({ node, theme, springs, ctrl, ...props }: NodeHoverProps) {
  return (
    <AnimatedGroup name={node.id} {...springs} {...props}>
      <KonvaHtml transform>
        <div onClick={() => window.alert(1)}>
          <BrainIcon />
        </div>
      </KonvaHtml>
    </AnimatedGroup>
  )
}
