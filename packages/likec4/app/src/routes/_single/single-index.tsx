// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { createFileRoute } from '@tanstack/react-router'

import { Link } from '@tanstack/react-router'

import { StaticLikeC4Diagram } from '@likec4/diagram'
import { useEffect, useState } from 'react'

import type { DiagramView } from '@likec4/core/types'
import { RichText } from '@likec4/core/types'
import { Markdown, NavigationPanel } from '@likec4/diagram/custom'
import { css } from '@likec4/styles/css'
import { Box, Burger, Card, Container, Group, SimpleGrid, Text } from '@mantine/core'
import { useDocumentTitle, useInViewport } from '@mantine/hooks'
import { randomInteger } from 'remeda'
import { ColorSchemeToggle } from '../../components/ColorSchemeToggle'
import { OverviewSearch } from '../../components/search/OverviewSearch'
import { SidebarDrawer } from '../../components/sidebar/Drawer'
import { SidebarDrawerOps } from '../../components/sidebar/state'
import { pageTitle } from '../../const'
import { useLikeC4Views } from '../../hooks'
import * as styles from './index.css'

export const Route = createFileRoute('/_single/single-index')({
  component: RouteComponent,
})

function RouteComponent() {
  useDocumentTitle(pageTitle)
  const views = useLikeC4Views()
  return (
    <Container size={'xl'}>
      <SidebarDrawer />
      <div
        className={css({
          containerName: 'likec4-root',
          containerType: 'inline-size',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: 'xs',
          gap: 'xs',
          position: 'sticky',
          top: '0',
          zIndex: '10',
          backgroundColor: 'likec4.panel.bg/85',
          backdropFilter: 'blur(8px)',
        })}
      >
        <NavigationPanel.Root css={{ position: 'relative', width: 'max-content', margin: '0' }}>
          <NavigationPanel.Body>
            <div style={{ width: 0, height: 36 }} aria-hidden />
            <Burger size="sm" onClick={SidebarDrawerOps.open} aria-label="Toggle navigation" />
            <NavigationPanel.Logo
              css={{ flexShrink: 0 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
            <OverviewSearch />
          </NavigationPanel.Body>
        </NavigationPanel.Root>
        <NavigationPanel.Root panelPosition="right" css={{ position: 'relative', margin: '0' }}>
          <NavigationPanel.Body>
            <div style={{ display: 'flex', alignItems: 'center', minHeight: 36 }}>
              <ColorSchemeToggle />
            </div>
          </NavigationPanel.Body>
        </NavigationPanel.Root>
      </div>
      <SimpleGrid
        p={{ base: 'md', sm: 'md' }}
        pt={{ base: 'sm', sm: 'sm' }}
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
  }, [inViewport, visible])

  return (
    <Card
      ref={ref}
      shadow="xs"
      padding="lg"
      radius="sm"
      className="group"
      withBorder>
      <Card.Section>
        <Box className={styles.previewBg} style={{ height: 200 }}>
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

      <Markdown
        value={RichText.from(view.description)}
        textScale={0.75}
        emptyText="No description"
        className={css({
          lineClamp: 3,
          mt: '1',
          transition: 'fast',
          opacity: {
            base: 0.8,
            _groupHover: 1,
          },
        })}
      />
      <Link to={'/view/$viewId/'} params={{ viewId: view.id }} search className={styles.cardLink}></Link>
    </Card>
  )
}
