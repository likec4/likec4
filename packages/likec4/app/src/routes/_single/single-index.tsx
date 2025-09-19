import { createFileRoute } from '@tanstack/react-router'

import { Link } from '@tanstack/react-router'

import { StaticLikeC4Diagram } from '@likec4/diagram'
import { useEffect, useState } from 'react'

import type { DiagramView } from '@likec4/core/types'
import { RichText } from '@likec4/core/types'
import { MarkdownBlock } from '@likec4/diagram/custom'
import { Box, Card, Container, Group, SimpleGrid, Text } from '@mantine/core'
import { useDocumentTitle, useInViewport } from '@mantine/hooks'
import { randomInteger } from 'remeda'
import { pageTitle } from '../../const'
import { useLikeC4Views } from '../../hooks'
import * as css from './index.css'

export const Route = createFileRoute('/_single/single-index')({
  component: RouteComponent,
})

function RouteComponent() {
  useDocumentTitle(pageTitle)
  const views = useLikeC4Views()
  return (
    <Container size={'xl'}>
      <SimpleGrid
        p={{ base: 'md', sm: 'xl' }}
        cols={{ base: 1, sm: 2, md: 3, xl: 4 }}
        spacing={{ base: 10, sm: 'xl' }}
        verticalSpacing={{ base: 'md', sm: 'xl' }}
      >
        {views.map((v) => <ViewCard key={v.id} view={v} />)}
      </SimpleGrid>
    </Container>
  )
}

function ViewCard({ view }: { view: DiagramView }) {
  const [visible, setVisible] = useState(false)
  const { ref, inViewport } = useInViewport()

  // Deferred rendering to avoid initial freeze
  useEffect(() => {
    if (!inViewport || visible) return
    const tm = setTimeout(() => setVisible(true), randomInteger(30, 80))
    return () => clearTimeout(tm)
  }, [inViewport])

  return (
    <Card
      ref={ref}
      shadow="xs"
      padding="lg"
      radius="sm"
      className="group"
      withBorder>
      <Card.Section>
        <Box className={css.previewBg} style={{ height: 200 }}>
          {visible && (
            <StaticLikeC4Diagram
              background={'transparent'}
              view={view}
              fitView
              fitViewPadding={'4px'}
              reduceGraphics
            />
          )}
        </Box>
      </Card.Section>

      <Group justify="space-between" mt="md">
        <Text fw={500}>{view.title ?? view.id}</Text>
      </Group>

      <MarkdownBlock
        value={RichText.from(view.description)}
        textScale={0.75}
        emptyText="No description"
        lineClamp={3}
        mt="[2px]"
        css={{
          transition: 'fast',
          opacity: {
            base: 0.8,
            _groupHover: 1,
          },
        }}
      />
      <Link to={'/view/$viewId/'} params={{ viewId: view.id }} search className={css.cardLink}></Link>
    </Card>
  )
}
