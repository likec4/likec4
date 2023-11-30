import type { DiagramView } from '@likec4/diagrams'
import { Diagram, useDiagramApi } from '@likec4/diagrams'
import { Box } from '@radix-ui/themes'
import { useWindowSize } from '@react-hookz/web/esm'
import { useCallback, useEffect, useRef } from 'react'
import { $pages } from '../../router'
import { cn } from '../../utils'
import styles from './view-page.module.css'

const Paddings = [70, 20, 20, 40] as const

type ViewAsReactProps = {
  diagram: DiagramView
}

function round(n: number, d = 1) {
  const m = Math.pow(10, d)
  return Math.round(n * m) / m
}

export function ViewAsReact({ diagram }: ViewAsReactProps) {
  const { width, height } = useWindowSize()
  const pageDivRef = useRef<HTMLDivElement>(null)
  const [ref, api] = useDiagramApi()

  const handleTransform = useCallback(() => {
    const stage = api.stage
    const style = pageDivRef.current?.style
    if (!stage || !style) {
      return
    }
    const pos = stage.getAbsolutePosition()
    let scale = stage.scaleX()
    while (scale < 0.5) {
      scale = scale / 0.5
    }
    const size = round(24 * scale)
    const x = round(pos.x)
    const y = round(pos.y)
    style.setProperty('--diagram-bg-size', `${size}px`)
    style.setProperty('--diagram-bg-position-x', `${x}px`)
    style.setProperty('--diagram-bg-position-y', `${y}px`)
  }, [api, pageDivRef])

  useEffect(() => {
    const stage = api.stage
    if (!stage) {
      return
    }
    stage.on('absoluteTransformChange', handleTransform)
    handleTransform()
    return () => {
      stage.off('absoluteTransformChange', handleTransform)
    }
  }, [api])

  return (
    <Box
      position={'fixed'}
      inset='0'
      className={cn(
        styles.reactDiagram
        // isActive && styles.active
      )}
      ref={pageDivRef}
    >
      <Diagram
        ref={ref}
        diagram={diagram}
        padding={Paddings}
        maxZoom={1.05}
        width={width}
        height={height}
        onNodeClick={node => {
          if (node.navigateTo) {
            $pages.view.open(node.navigateTo)
          } else {
            api.centerOnNode(node, {
              keepZoom: true
            })
          }
        }}
        onStageClick={_ => ({})}
        onEdgeClick={_ => ({})}
      />
    </Box>
  )
}
