import { css, cx } from '@likec4/styles/css'
import { HStack, styled } from '@likec4/styles/jsx'
import { hstack, vstack } from '@likec4/styles/patterns'
import {
  type PopoverProps,
  Popover,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import { useState } from 'react'
import { ElementTag, Markdown } from '../../base-primitives'
import { Link } from '../../components/Link'
import { useDiagramEventHandlers } from '../../context/DiagramEventHandlers'
import { useCurrentView } from '../../hooks'
import { useDiagram, useOnDiagramEvent } from '../../hooks/useDiagram'
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'
import type { NavigationPanelActorSnapshot } from '../actor'

const selector = ({ context }: NavigationPanelActorSnapshot) => {
  const view = context.viewModel
  return {
    id: view.id,
    title: view.titleOrUntitled,
    description: view.description,
    tags: view.tags,
    links: view.links,
  }
}

type ViewDetailsCardData = ReturnType<typeof selector>

export const LayoutDriftControl = (props: PopoverProps) => {
  const view = useCurrentView()
  const { onLayoutTypeChange } = useDiagramEventHandlers()
  const [opened, setOpened] = useState(false)
  const portalProps = useMantinePortalProps()

  // if (!view.drifts || !onLayoutTypeChange || view.drifts.length === 0) return null

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
      <Trigger onOpen={() => onLayoutTypeChange(view._layout === 'manual' ? 'auto' : 'manual')} />
      {/* {opened && <ViewDetailsCardDropdown data={data} onClose={() => setOpened(false)} />} */}
    </Popover>
  )
}

const Trigger = ({ onOpen }: { onOpen: () => void }) => (
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
            base: 'mantine.colors.orange.lightColor',
          },
          backgroundColor: {
            base: 'mantine.colors.orange.light',
            _hover: 'mantine.colors.orange.lightHover',
          },
          display: {
            base: 'none',
            '@/xs': 'flex',
          },
        }),
      )}>
      <IconAlertTriangle size={16} stroke={1.8} />
    </UnstyledButton>
  </Popover.Target>
)

const SectionHeader = styled('div', {
  base: {
    fontSize: 'xs',
    color: 'mantine.colors.dimmed',
    fontWeight: 500,
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
