import { Diagram, useDiagramApi } from '@likec4/diagrams'
import { Box, Flex, Heading, Text } from '@radix-ui/themes'
import { useWindowSize } from '@react-hookz/web/esm'
import { $pages } from '../router'
import { DiagramNotFound, ViewActionsToolbar } from '../components'
import { useLikeC4View } from '../data'
import { Fragment, useCallback, useEffect, useRef } from 'react'
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
    <Box position={'fixed'} inset='0' className={styles.diagramBg} ref={pageDivRef}>
      <Diagram
        ref={ref}
        diagram={diagram}
        padding={showUI ? Paddings : undefined}
        width={width}
        height={height}
        onNodeClick={node => {
          if (node.navigateTo) {
            $pages.view.open(node.navigateTo)
          }
        }}
        onEdgeClick={_ => ({})}
      />
      {showUI && (
        <Fragment key='ui'>
          <Flex
            position={'fixed'}
            top='0'
            p='3'
            style={{
              left: 54
            }}
            direction={'column'}
          >
            <Text
              size={'1'}
              trim={'start'}
              color='gray'
              as='div'
              className='whitespace-nowrap select-none'
            >
              id: <span className='select-all'>{diagram.id}</span>
            </Text>
            <Heading size={'5'} className='select-all'>
              {diagram.title || 'Untitled'}
            </Heading>
          </Flex>
          <ViewActionsToolbar diagram={diagram} />
        </Fragment>
      )}
    </Box>
  )
}
