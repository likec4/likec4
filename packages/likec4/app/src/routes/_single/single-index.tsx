import { createFileRoute } from '@tanstack/react-router'

import { Link } from '@tanstack/react-router'

import { StaticLikeC4Diagram, useLikeC4Model } from '@likec4/diagram'
import { useState } from 'react'

import { Box, Card, Container, Group, SimpleGrid, Text } from '@mantine/core'
import { useDocumentTitle } from '@mantine/hooks'
// import { useLikeC4Model } from 'likec4:model'
import type { aux, LikeC4ViewModel } from '@likec4/core/model'
import { MarkdownBlock } from '@likec4/diagram/custom'
import { useTimeoutEffect } from '@react-hookz/web'
import * as css from './index.css'

export const Route = createFileRoute('/_single/single-index')({
  component: RouteComponent,
})

function RouteComponent() {
  useDocumentTitle('LikeC4')
  const views = [...useLikeC4Model('layouted').views()]
  return (
    <Container size={'xl'}>
      <SimpleGrid
        p={{ base: 'md', sm: 'xl' }}
        cols={{ base: 1, sm: 2, md: 3, xl: 4 }}
        spacing={{ base: 10, sm: 'xl' }}
        verticalSpacing={{ base: 'md', sm: 'xl' }}
      >
        {views.map(v => <ViewCard key={v.id} view={v} />)}
      </SimpleGrid>
    </Container>
  )
}

function ViewCard({ view }: { view: LikeC4ViewModel<aux.UnknownLayouted> }) {
  const [visible, setVisible] = useState(false)

  useTimeoutEffect(() => {
    setVisible(true)
  }, 100)

  return (
    <Card
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
              view={view.$view}
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
        value={view.description}
        textScale={0.75}
        emptyText="No description"
        lineClamp={3}
        mt="2"
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
