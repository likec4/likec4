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
import * as m from 'motion/react-m'
import { ElementTag, MarkdownBlock } from '../../base/primitives'
import { Link } from '../../components/Link'
import { useDiagram } from '../../hooks/useDiagram'
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'
import type { NavigationPanelActorSnapshot } from '../actor'
import { useNavigationActorSnapshot } from '../hooks'

const selector = ({ context }: NavigationPanelActorSnapshot) => {
  const view = context.viewModel
  return {
    id: view.id,
    title: view.titleOrUntitled,
    description: view.description,
    tags: view.tags,
    links: view.links,
    relativePath: view.$view.relativePath,
  }
}

type ViewDetailsCardData = ReturnType<typeof selector>

export const ViewDetailsCard = (props: PopoverProps) => {
  const data = useNavigationActorSnapshot(selector)
  const portalProps = useMantinePortalProps()

  return (
    <Popover
      position="bottom-end"
      shadow="xl"
      clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
      trapFocus
      {...portalProps}
      {...props}
    >
      <ViewDetailsCardTrigger linksCount={data.links.length} />
      <ViewDetailsCardDropdown data={data} />
    </Popover>
  )
}

const ViewDetailsCardTrigger = ({ linksCount }: { linksCount: number }) => (
  <Popover.Target>
    <UnstyledButton
      component={m.button}
      layout="position"
      whileTap={{
        scale: 0.95,
        translateY: 1,
      }}
      className={cx(
        'group',
        hstack({
          gap: '8',
          paddingInline: '2xs',
          paddingBlock: '2xs',
          rounded: 'sm',
          userSelect: 'none',
          cursor: 'pointer',
          color: {
            base: 'likec4.panel.action-icon.text',
            _hover: 'likec4.panel.action-icon.text.hover',
          },
          backgroundColor: {
            _hover: 'likec4.panel.action-icon.bg.hover',
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
        <HStack gap={1}>
          <IconLink size={16} stroke={2} />
          <Box
            css={{
              fontSize: '11px',
              fontWeight: 600,
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

const ViewDetailsCardDropdown = ({
  data: {
    id,
    title,
    description,
    tags,
    links,
    relativePath,
  },
}: { data: ViewDetailsCardData }) => {
  const diagram = useDiagram()
  return (
    <Popover.Dropdown
      className={cx(
        'nowheel nopan nodrag',
        vstack({
          margin: 'xs',
          layerStyle: 'likec4.dropdown',
          gap: '2xs',
          py: 'sm',
          px: 'md',
          pointerEvents: 'all',
          maxWidth: 'calc(100cqw - 32px)',
          minWidth: 'calc(100cqw - 50px)',
          maxHeight: 'calc(100cqh - 100px)',
          width: 'max-content',
          '@/sm': {
            minWidth: 400,
            maxWidth: 550,
          },
          '@/lg': {
            maxWidth: 700,
          },
        }),
      )}>
      <Text component="div" fw={500} size="xl">{title}</Text>
      <HStack alignItems={'flex-start'}>
        <ViewBadge label="id" value={id} />
        {relativePath && <ViewBadge label="source" value={relativePath} />}
        <HStack gap={'xs'} flexWrap={'wrap'}>
          {tags.map((tag, i) => (
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
      {links.length > 0 && (
        <>
          <Text component="div" fw={500} size="xs" c="dimmed" mt="sm">Links</Text>
          <HStack gap={'xs'} flexWrap={'wrap'}>
            {links.map((link, i) => <Link key={`${i}-${link.url}`} value={link} />)}
          </HStack>
        </>
      )}
      {description.isEmpty && <Text component="div" fw={500} size="xs" c="dimmed" my="md">No description</Text>}
      {description.nonEmpty && (
        <>
          <Text component="div" fw={500} size="xs" c="dimmed" mt="sm">Description</Text>
          <MarkdownBlock
            value={description}
            emptyText="No description"
            className={css({
              userSelect: 'all',
            })}
          />
        </>
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
    <HStack gap={2}>
      <ViewBadgeLabel>{label}</ViewBadgeLabel>
      <ViewBadgeValue>{value}</ViewBadgeValue>
    </HStack>
  )
}

const ViewBadgeLabel = styled(Box, {
  base: {
    color: 'mantine.colors.dimmed',
    fontWeight: 500,
    fontSize: 'xxs',
  },
})

const ViewBadgeValue = Badge.withProps({
  size: 'sm',
  radius: 'sm',
  variant: 'light',
  color: 'gray',
  tt: 'none',
  fw: 500,
  classNames: {
    root: css({
      width: 'max-content',
      overflow: 'visible',
      px: '4',
      color: {
        _light: 'mantine.colors.gray[8]',
      },
    }),
    label: css({
      overflow: 'visible',
    }),
    section: css({
      opacity: 0.5,
      userSelect: 'none',
      marginInlineEnd: 2,
    }),
  },
})
