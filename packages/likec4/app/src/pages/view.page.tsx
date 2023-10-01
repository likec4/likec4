import { Diagram, useDiagramRef } from '@likec4/diagrams'
import { Box, Flex, Heading, Text } from '@radix-ui/themes'
import { useRenderCount, useWindowSize } from '@react-hookz/web/esm'
import { useEffect } from 'react'
import { $pages } from '~/router'
import Navbar from '../components/Navbar'
import { useLikeC4View } from '../data'

const Paddings = [60, 20, 20, 20] as const

type ViewPageProps = {
  viewId: string
  showUI?: boolean
}
export function ViewPage({ viewId, showUI = true }: ViewPageProps) {
  const { width, height } = useWindowSize()
  const diagramApi = useDiagramRef()
  const diagram = useLikeC4View(viewId)

  const render = useRenderCount()

  useEffect(() => {
    console.log('ViewPage: mount')
    return () => {
      console.log('ViewPage: unmount')
    }
  }, [])

  console.log(`ViewPage: ${render}`)

  return (
    <Box position={'fixed'} inset='0' className='overflow-hidden'>
      <Diagram
        ref={diagramApi.ref}
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
        <>
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
          <Navbar diagramApi={diagramApi} />
        </>
      )}
    </Box>
  )
}
