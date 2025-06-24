import { createFileRoute } from '@tanstack/react-router'

import { Link } from '@tanstack/react-router'

import { StaticLikeC4Diagram, useLikeC4Model } from '@likec4/diagram'
import { memo, useLayoutEffect, useState } from 'react'

import type { DiagramView } from '@likec4/core'
import { Box, Card, Container, Group, SimpleGrid, Text } from '@mantine/core'
import { useDocumentTitle, useInViewport } from '@mantine/hooks'
import { keys } from 'remeda'
// import { useLikeC4Model } from 'likec4:model'
import * as css from './index.css'

export const Route = createFileRoute('/_single/single-index')({
  component: RouteComponent,
})

function RouteComponent() {
  useDocumentTitle('LikeC4')
  const views = keys(useLikeC4Model().$model.views)
  return (
    <Container size={'xl'}>
      <SimpleGrid
        p={{ base: 'md', sm: 'xl' }}
        cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
        spacing={{ base: 10, sm: 'xl' }}
        verticalSpacing={{ base: 'md', sm: 'xl' }}
      >
        {views.map(v => <ViewCard key={v} viewId={v} />)}
      </SimpleGrid>
    </Container>
  )
}

const ViewCard = memo<{ viewId: string }>(({ viewId }) => {
  const diagram = useLikeC4Model('layouted').findView(viewId)
  if (!diagram || !diagram.isDiagram()) {
    return null
  }
  const { id, title, description } = diagram.$view
  return (
    <Card
      shadow="xs"
      padding="lg"
      radius="sm"
      withBorder>
      <Card.Section>
        <DiagramPreview diagram={diagram.$view} />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>{title}</Text>
      </Group>

      <Text size="sm" c="dimmed">
        {/* {description} */}
      </Text>
      <Link to={'/view/$viewId/'} params={{ viewId: id }} search className={css.cardLink}></Link>
    </Card>
  )
})

function DiagramPreview({ diagram }: { diagram: DiagramView }) {
  const { ref, inViewport } = useInViewport()
  const [visible, setVisible] = useState(inViewport)

  useLayoutEffect(() => {
    if (inViewport && !visible) {
      setVisible(true)
    }
  }, [inViewport])

  return (
    <Box ref={ref} className={css.previewBg} style={{ height: 175 }}>
      {visible && (
        <StaticLikeC4Diagram
          background={'transparent'}
          view={diagram}
          fitView
          fitViewPadding={'4px'}
          reduceGraphics
        />
      )}
    </Box>
  )
}
