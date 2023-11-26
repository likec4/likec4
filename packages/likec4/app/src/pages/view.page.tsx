import { Diagram, useDiagramApi } from '@likec4/diagrams'
import { Box } from '@radix-ui/themes'
import { useWindowSize } from '@react-hookz/web/esm'
import { useCallback, useEffect, useRef } from 'react'
import { DiagramNotFound } from '../components'
import { Header } from '../components/view-page/Header'
import { useLikeC4View } from '../data'
import { $pages } from '../router'
import { cn } from '../utils'
import styles from './view-page.module.css'

const Paddings = [70, 20, 20, 40] as const

type ViewPageProps = {
  viewId: string
  showUI?: boolean
}

function round(n: number, d = 1) {
  const m = Math.pow(10, d)
  return Math.round(n * m) / m
}

export function ViewPage({ viewId, showUI = true }: ViewPageProps) {
  const { width, height } = useWindowSize()
  const diagram = useLikeC4View(viewId)
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

  if (!diagram) {
    return <DiagramNotFound viewId={viewId} />
  }

  return (
    <>
      <Box
        position={'fixed'}
        inset='0'
        className={cn(
          styles.diagramBg
          // isActive && styles.active
        )}
        ref={pageDivRef}
      >
        <Diagram
          ref={ref}
          diagram={diagram}
          padding={showUI ? Paddings : undefined}
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
      {showUI && <Header diagram={diagram} />}
    </>
  )
}
