import { extractViewTitleFromPath } from '@likec4/core/model'
import { type LikeC4View, RichText } from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { Box, HStack, styled, Txt, VStack } from '@likec4/styles/jsx'
import { hstack, vstack } from '@likec4/styles/patterns'
import { idBadge } from '@likec4/styles/recipes'
import {
  type PopoverProps,
  Badge,
  Popover,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { IconId, IconLink } from '@tabler/icons-react'
import { deepEqual } from 'fast-equals'
import * as m from 'motion/react-m'
import { useState } from 'react'
import { ElementTag, Markdown } from '../../base-primitives'
import { Link } from '../../components/Link'
import { useDiagram, useOnDiagramEvent } from '../../hooks/useDiagram'
import { selectDiagramContext, useDiagramSelector } from '../../hooks/useDiagram'
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'

const selector = selectDiagramContext(context => {
  const view = context.view
  return {
    id: view.id,
    title: (view.title && extractViewTitleFromPath(view.title)) || 'Untitled View',
    description: view.description,
    tags: view.tags ?? [],
    links: view.links ?? [],
  }
}, deepEqual)

type ViewDetailsCardData = Pick<LikeC4View, 'id' | 'title' | 'description' | 'tags' | 'links'>

const SectionHeader = styled('div', {
  base: {
    fontSize: 'xs',
    color: 'text.dimmed',
    fontWeight: 'medium',
    userSelect: 'none',
    mb: 'xxs',
  },
})

// function ViewDetailsCardDropdown({
//   view: {
//     id,
//     title,
//     description,
//     tags,
//     links,
//   },
// }: { view: ViewDetailsCardData }) {
export function ViewDetailsCard() {
  const {
    id,
    title,
    description,
    tags,
    links,
  } = useDiagramSelector(selector)
  const diagram = useDiagram()

  const titleValue = title && extractViewTitleFromPath(title) || 'Untitled View'

  const desc = RichText.from(description)

  return (
    <VStack
      className="nowheel nopan nodrag"
      css={{
        gap: 'md',
        pointerEvents: 'all',
        maxWidth: '[calc(100cqw - 52px)]',
        minWidth: '[200px]',
        maxHeight: '[calc(100cqh - 100px)]',
        width: 'auto',
        cursor: 'default',
        overflow: 'auto',
        overscrollBehavior: 'contain',
        '@/sm': {
          minWidth: '[400px]',
          maxWidth: '[550px]',
        },
        '@/lg': {
          maxWidth: '[700px]',
        },
      }}>
      <section>
        {/* <ViewIdBadge>{id}</ViewIdBadge> */}
        <Txt fontWeight={'bold'} size="xl" lh={'sm'}>{titleValue}</Txt>
        {
          /* <HStack alignItems={'flex-start'} mt="1">
          <ViewBadge label="id" value={id} />
          <HStack gap="xs" flexWrap="wrap">
            {tags.map((tag) => (
              <ElementTag
                key={tag}
                tag={tag}
                cursor="pointer"
                onClick={e => {
                  e.stopPropagation()
                  diagram.openSearch(`#${tag}`)
                }} />
            ))}
          </HStack>
        </HStack> */
        }
      </section>
      {tags && tags.length > 0 && (
        <section className={hstack({ alignItems: 'baseline' })}>
          <SectionHeader>Tags</SectionHeader>
          <HStack gap="xs" flexWrap="wrap">
            {tags.map((tag) => (
              <ElementTag
                key={tag}
                tag={tag}
                cursor="pointer"
                onClick={e => {
                  e.stopPropagation()
                  diagram.openSearch(`#${tag}`)
                }} />
            ))}
          </HStack>
        </section>
      )}
      {links && links.length > 0 && (
        <section className={hstack({ alignItems: 'baseline' })}>
          <SectionHeader>Links</SectionHeader>
          <HStack gap="xs" flexWrap="wrap">
            {links.map((link, i) => <Link key={`${i}-${link.url}`} value={link} />)}
          </HStack>
        </section>
      )}
      {desc.isEmpty && (
        <Text component="div" fw={500} size="xs" c="dimmed" style={{ userSelect: 'none' }}>No description</Text>
      )}
      {desc.nonEmpty && (
        <section>
          <Markdown
            value={desc}
            fontSize="sm"
            emptyText="No description" />
        </section>
      )}
    </VStack>
  )
}

const ViewBadge = ({
  label,
  value,
}: {
  label: string
  value: string
}) => {
  return (
    <HStack gap="0.5">
      <ViewBadgeLabel>{label}</ViewBadgeLabel>
      <Badge
        size="sm"
        radius="sm"
        variant="light"
        color="gray"
        tt="none"
        fw={500}
        classNames={{
          root: css({
            width: 'max',
            overflow: 'visible',
            px: '1',
            color: {
              _dark: 'mantine.gray[4]',
              _light: 'mantine.gray[8]',
            },
          }),
          label: css({
            overflow: 'visible',
          }),
          section: css({
            opacity: 0.5,
            userSelect: 'none',
            marginInlineEnd: '0.5',
          }),
        }}>
        {value}
      </Badge>
    </HStack>
  )
}

const ViewBadgeLabel = styled('div', {
  base: {
    color: 'text.dimmed',
    fontWeight: 'medium',
    fontSize: 'xxs',
    userSelect: 'none',
  },
})

const ViewIdBadge = styled('div', idBadge)
