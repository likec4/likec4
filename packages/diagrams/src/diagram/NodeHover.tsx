import { useTransition } from '@react-spring/konva'
import type { KonvaNodeEvents } from 'react-konva'
import { AnimatedGroup, Layer } from '../konva'
import { KonvaHtml } from '../konva-html'
import { BrainIcon } from './icons'
import { nodeSprings, type NodeSprings, type NodeSpringsCtrl } from './springs'
import { useHoveredNode } from './state'
import type { DiagramNode, DiagramTheme } from './types'

interface NodeHoverProps extends KonvaNodeEvents {
  node: DiagramNode
  theme: DiagramTheme
  ctrl: NodeSpringsCtrl
}

export function NodeHover({ node, theme, ctrl, ...props }: NodeHoverProps) {
  ctrl.springs
  return (
    <AnimatedGroup name={node.id} {...ctrl.springs} {...props}>
      <KonvaHtml transform>
        <div onClick={() => window.alert(1)}>
          <BrainIcon />
        </div>
      </KonvaHtml>
    </AnimatedGroup>
  )
}

export const NodeHoverLayer = ({ theme }: { theme: DiagramTheme }) => {
  const [hoveredNode] = useHoveredNode()
  const transitions = useTransition(hoveredNode ? [hoveredNode] : [], {
    from: nodeSprings({
      opacity: 0.4
    }) as unknown as NodeSprings,
    enter: nodeSprings(),
    leave: nodeSprings({
      opacity: 0
    }),
    update: nodeSprings(),
    delay: 50,
    expires: true,
    keys(item) {
      return item.id
    }
    // keys: (n: DiagramNode) => n.id,
    // delay(key) {
    //   const isUpdating = nodes.some(n => keyOf(n) === key)
    //   return isUpdating ? 30 : 0
    // },
    // config: (_node, _index, state): SpringConfig => {
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    //   if (state === 'leave') {
    //     return {
    //       precision: 0.005,
    //       duration: 120
    //     }
    //   }
    //   return {
    //     precision: 0.005
    //   }
    // }
  })
  return (
    <Layer>
      {transitions((_, item, { key, ctrl }) => {
        return <NodeHover key={key} node={item} theme={theme} ctrl={ctrl} />
      })}
    </Layer>
  )
}
