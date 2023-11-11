import { Diagram, useDiagramApi, type DiagramProps } from '@likec4/diagrams'
import { useUpdateEffect, useWindowSize } from '@react-hookz/web/esm'
import { useCallback, useEffect, useRef } from 'react'

const Paddings = [30, 20, 20, 20] as const

type LikeC4DiagramProps = Omit<DiagramProps, 'padding' | 'width' | 'height' | 'onStageContextMenu'>

function round(n: number) {
  return Math.round(n * 10) / 10
}

export function LikeC4Diagram({
  diagram,
  onEdgeClick,
  onNodeClick,
  onStageClick,
  onNodeContextMenu
}: LikeC4DiagramProps) {
  const windowSize = useWindowSize(undefined, false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [ref, api] = useDiagramApi()

  const handleTransform = useCallback(() => {
    const stage = api.stage
    const style = containerRef.current?.style
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
  }, [api, containerRef])

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

  // centerAndFit if only width or height changed
  // but not when diagram changed (it will be handled by Diagram internally)
  const lastTrackedDiagram = useRef(diagram.id)
  useUpdateEffect(() => {
    if (diagram.id !== lastTrackedDiagram.current) {
      lastTrackedDiagram.current = diagram.id
    } else {
      api.centerAndFit()
    }
  }, [diagram.id, diagram.width, diagram.height])

  return (
    <div
      ref={containerRef}
      data-vscode-context='{"preventDefaultContextMenuItems": true}'
      className='likec4-container'
    >
      <Diagram
        ref={ref}
        diagram={diagram}
        padding={Paddings}
        width={windowSize.width}
        height={windowSize.height}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onStageContextMenu={(stage, e) => {
          e.evt.stopPropagation()
        }}
        onEdgeClick={onEdgeClick}
        onStageClick={onStageClick}
      />
    </div>
  )
}
