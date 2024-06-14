import type { DiagramView, OnNodeClick } from '@likec4/diagrams'
import { Diagram, useDiagramApi } from '@likec4/diagrams'
import { Box } from '@mantine/core'
import { useWindowSize } from '@react-hookz/web'
import { useCallback, useEffect, useRef } from 'react'
import { reactDiagram } from './ViewAsReact.css'

const Paddings = [70, 20, 20, 40] as const

type ViewAsReactProps = {
  diagram: DiagramView
  onNodeClick?: OnNodeClick | undefined
}

function round(n: number, d = 1) {
  const m = Math.pow(10, d)
  return Math.round(n * m) / m
}

export default function ViewAsReact({ diagram, onNodeClick }: ViewAsReactProps) {
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
      pos={'fixed'}
      inset={0}
      className={reactDiagram}
      ref={pageDivRef}
    >
      <Diagram
        ref={ref}
        diagram={diagram}
        padding={Paddings}
        maxZoom={1.05}
        width={width}
        height={height}
        onNodeClick={(node, event) => {
          if (onNodeClick) {
            return onNodeClick(node, event)
          }

          api.centerOnNode(node, {
            keepZoom: true
          })
        }}
        onStageClick={_ => ({})}
        onEdgeClick={_ => ({})}
      />
    </Box>
  )
}
