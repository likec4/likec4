import { createFileRoute, Link } from '@tanstack/react-router'

import type { DiagramView } from '@likec4/core'
// import { LikeC4View } from '@likec4/diagram'
import { StaticLikeC4Diagram } from '@likec4/diagram'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { Box, Card, Container, Flex, Heading, IconButton, Inset, Section, Separator, Text } from '@radix-ui/themes'
import { useDebouncedEffect } from '@react-hookz/web'
import { memo, useState } from 'react'
import { useLikeC4View } from 'virtual:likec4'
import { useViewGroups, type ViewGroups } from '../data/index-page'
import * as styles from './index.css'
import { cssPreviewCardLink } from './view.css'

export const Route = createFileRoute('/')({
  component: IndexPage
})

export function IndexPage() {
  const viewGroups = useViewGroups()
  return (
    <Container
      size={'4'}
      px={{
        initial: '3',
        lg: '1'
      }}
    >
      {viewGroups.map(g => <ViewsGroup key={g.path} {...g} />)}
      {viewGroups.length === 0 && (
        <Flex position="fixed" inset="0" align="center" justify="center">
          <Card color="red" size="4">
            <Flex gap="4" direction="row" align="center">
              <Box grow="0" shrink="0" pt="1">
                <IconButton variant="ghost" color="red">
                  <ExclamationTriangleIcon width={20} height={20} />
                </IconButton>
              </Box>
              <Flex gap="3" direction="column">
                <Heading trim="both" color="red" size="4">
                  No diagrams found
                </Heading>
              </Flex>
            </Flex>
          </Card>
        </Flex>
      )}
    </Container>
  )
}

function ViewsGroup({ isRoot, path, views }: ViewGroups[number]) {
  return (
    <Flex asChild gap={'4'} direction={'column'}>
      <Section size="2">
        <Flex gap="2">
          <Heading
            color={isRoot ? undefined : 'gray'}
            // className={cn(isRoot || styles.dimmed)}
            trim="end"
          >
            views
          </Heading>
          {!isRoot && (
            <>
              <Heading
                color="gray"
                //  className={styles.dimmed}
                trim={'end'}>
                /
              </Heading>
              <Heading trim={'end'}>{path}</Heading>
            </>
          )}
        </Flex>
        <Separator orientation="horizontal" my="2" size={'4'} />
        <Flex
          gap={{
            initial: '4',
            md: '6'
          }}
          wrap={{
            initial: 'nowrap',
            md: 'wrap'
          }}
          direction={{
            initial: 'column',
            md: 'row'
          }}
          align="stretch"
        >
          {views.map(v => <ViewCard key={v} viewId={v} />)}
        </Flex>
      </Section>
    </Flex>
  )
}

const ViewCard = memo<{ viewId: string }>(({ viewId }) => {
  const diagram = useLikeC4View(viewId)
  if (!diagram) {
    return null
  }
  const { id, title, description } = diagram
  return (
    <Box asChild shrink="0" grow="1">
      <Card style={{ width: 350, maxWidth: 350 }} variant="surface" size="1">
        <Inset clip="padding-box" side="top" pb="current">
          <DiagramPreview diagram={diagram} />
        </Inset>
        <Text as="div" size="2" weight="bold" trim="start">
          {title || id}
        </Text>
        <Text
          as="div"
          color="gray"
          size="2"
          my="1"
          // className={cn(isEmpty(description?.trim()) && styles.dimmed)}
          style={{
            whiteSpace: 'pre-line'
          }}
        >
          {description?.trim() || 'no description'}
        </Text>
        <Link to="/view/$viewId/editor" params={{ viewId: id }} search className={cssPreviewCardLink}>{' '}</Link>
      </Card>
    </Box>
  )
}, (prev, next) => prev.viewId === next.viewId)

function DiagramPreview(props: { diagram: DiagramView }) {
  const [diagram, setDiagram] = useState<DiagramView | null>(null)

  // defer rendering to update to avoid flickering
  useDebouncedEffect(
    () => {
      setDiagram(props.diagram)
    },
    [props.diagram],
    50
  )

  return (
    <Box className={styles.previewBg} style={{ width: 350, height: 175 }}>
      {diagram && (
        <StaticLikeC4Diagram
          view={diagram}
          keepAspectRatio={false}
          fitView
          fitViewPadding={0.1}
          initialWidth={350}
          initialHeight={175} />
      )}
    </Box>
  )
}
