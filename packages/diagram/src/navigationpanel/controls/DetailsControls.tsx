import { extractViewTitleFromPath } from '@likec4/core/model'
import { RichText } from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { Box, HStack, styled } from '@likec4/styles/jsx'
import { hstack, vstack } from '@likec4/styles/patterns'
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
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'
import type { NavigationPanelActorSnapshot } from '../actor'
import { useNavigationActorSnapshot } from '../hooks'

const selector = ({ context }: NavigationPanelActorSnapshot) => {
  const view = context.view
  return {
    id: view.id,
    title: context.viewModel?.title ?? (view.title && extractViewTitleFromPath(view.title)) ?? 'Untitled View',
    description: context.viewModel?.description ?? RichText.from(view.description),
    tags: view.tags ?? [],
    links: view.links ?? [],
  }
}

type ViewDetailsCardData = ReturnType<typeof selector>

export const DetailsControls = (props: PopoverProps) => {
  const [opened, setOpened] = useState(false)
  const data = useNavigationActorSnapshot(selector, deepEqual)
  const portalProps = useMantinePortalProps()

  return (
    <Popover
      position="bottom-end"
      shadow="xl"
      clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
      offset={{
        mainAxis: 4,
      }}
      opened={opened}
      onChange={setOpened}
      {...portalProps}
      {...props}
    >
      <ViewDetailsCardTrigger linksCount={data.links.length} onOpen={() => setOpened(true)} />
      {opened && <ViewDetailsCardDropdown data={data} onClose={() => setOpened(false)} />}
    </Popover>
  )
}

const ViewDetailsCardTrigger = ({ linksCount, onOpen }: { linksCount: number; onOpen: () => void }) => (
  <Popover.Target>
    <UnstyledButton
      component={m.button}
      layout="position"
      whileTap={{
        scale: 0.95,
        translateY: 1,
      }}
      onClick={e => {
        e.stopPropagation()
        onOpen()
      }}
      className={cx(
        'group',
        hstack({
          gap: '2',
          paddingInline: '2',
          paddingBlock: '1',
          rounded: 'sm',
          userSelect: 'none',
          cursor: 'pointer',
          color: {
            base: 'likec4.panel.action',
            _hover: 'likec4.panel.action.hover',
          },
          backgroundColor: {
            _hover: 'likec4.panel.action.bg.hover',
          },
          display: {
            base: 'none',
            '@/xs': 'flex',
          },
        }),
        ``,
      )}>
      <IconId size={16} stroke={1.8} />
      {linksCount > 0 && (
        <HStack gap={'[1px]'}>
          <IconLink size={14} stroke={2} />
          <Box
            css={{
              fontSize: '11px',
              fontWeight: 'bold',
              lineHeight: 1,
              opacity: 0.8,
            }}>
            {linksCount}
          </Box>
        </HStack>
      )}
    </UnstyledButton>
  </Popover.Target>
)

const SectionHeader = styled('div', {
  base: {
    fontSize: 'xs',
    color: 'text.dimmed',
    fontWeight: 'medium',
    userSelect: 'none',
    mb: 'xxs',
  },
})

const ViewDetailsCardDropdown = ({
  data: {
    id,
    title,
    description,
    tags,
    links,
  },
  onClose,
}: { data: ViewDetailsCardData; onClose: () => void }) => {
  const diagram = useDiagram()

  useOnDiagramEvent('paneClick', onClose)
  useOnDiagramEvent('nodeClick', onClose)

  return (
    <Popover.Dropdown
      className={cx(
        'nowheel nopan nodrag',
        vstack({
          margin: 'xs',
          layerStyle: 'likec4.dropdown',
          gap: 'md',
          padding: 'md',
          paddingBottom: 'lg',
          pointerEvents: 'all',
          maxWidth: 'calc(100cqw - 52px)',
          minWidth: '200px',
          maxHeight: 'calc(100cqh - 100px)',
          width: 'max-content',
          cursor: 'default',
          overflow: 'auto',
          overscrollBehavior: 'contain',
          '@/sm': {
            minWidth: 400,
            maxWidth: 550,
          },
          '@/lg': {
            maxWidth: 700,
          },
        }),
      )}>
      <section>
        <Text component="div" fw={500} size="xl" lh={'sm'}>{title}</Text>
        <HStack alignItems={'flex-start'} mt="1">
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
        </HStack>
      </section>
      {links.length > 0 && (
        <section className={hstack({ alignItems: 'baseline' })}>
          <SectionHeader>Links</SectionHeader>
          <HStack gap="xs" flexWrap="wrap">
            {links.map((link, i) => <Link key={`${i}-${link.url}`} value={link} />)}
          </HStack>
        </section>
      )}
      {description.isEmpty && (
        <Text component="div" fw={500} size="xs" c="dimmed" style={{ userSelect: 'none' }}>No description</Text>
      )}
      {description.nonEmpty && (
        <section>
          <SectionHeader>Description</SectionHeader>
          <Markdown
            value={description}
            fontSize="sm"
            emptyText="No description"
            className={css({
              userSelect: 'all',
            })}
          />
        </section>
      )}
    </Popover.Dropdown>
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
            width: 'max-content',
            overflow: 'visible',
            px: '1',
            color: {
              _dark: 'mantine.colors.gray[4]',
              _light: 'mantine.colors.gray[8]',
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
