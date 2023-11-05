import { Diagram } from '@likec4/diagrams'
import { Box, Flex, Heading, Text } from '@radix-ui/themes'
import { useWindowSize } from '@react-hookz/web/esm'
import { $pages } from '../router'
import { DiagramNotFound, ViewActionsToolbar } from '../components'
import { useLikeC4View } from '../data'
import { Fragment } from 'react'

const Paddings = [70, 20, 20, 40] as const

type ViewPageProps = {
  viewId: string
  showUI?: boolean
}
export function ViewPage({ viewId, showUI = true }: ViewPageProps) {
  const { width, height } = useWindowSize()
  const diagram = useLikeC4View(viewId)

  if (!diagram) {
    return <DiagramNotFound viewId={viewId} />
  }

  return (
    <Box position={'fixed'} inset='0' className='overflow-hidden'>
      <Diagram
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
