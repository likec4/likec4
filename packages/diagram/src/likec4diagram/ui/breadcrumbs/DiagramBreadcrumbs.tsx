import { nonexhaustive } from '@likec4/core'
import { css } from '@likec4/styles/css'
import { HStack } from '@likec4/styles/jsx'
import {
  Burger,
  Popover,
  PopoverTarget,
  UnstyledButton,
} from '@mantine/core'
import { ThemeIcon } from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { memo } from 'react'
import { useMantinePortalProps } from '../../../hooks/useMantinePortalProps'
import {
  BreadcrumbsActorContext,
  useBreadcrumbsActorRef,
  useBreadcrumbsActorSnapshot,
} from './ActorContext'
import { DiagramBreadcrumbsDropdown } from './DiagramBreadcrumbsDropdown'
import { breadcrumbTitle } from './styles.css'

export const DiagramBreadcrumbs = memo(() => (
  <BreadcrumbsActorContext>
    <DiagramBreadcrumbsImpl />
  </BreadcrumbsActorContext>
))
DiagramBreadcrumbs.displayName = 'DiagramBreadcrumbs'

const BreadcrumbsSeparator = () => (
  <ThemeIcon variant="transparent" size={'xs'} c="dimmed">
    <IconChevronRight size={14} />
  </ThemeIcon>
)

const DiagramBreadcrumbsImpl = () => {
  const actor = useBreadcrumbsActorRef()
  const {
    opened,
    breadcrumbsItems,
  } = useBreadcrumbsActorSnapshot(snapshot => ({
    opened: snapshot.hasTag('active'), // || true,
    breadcrumbsItems: snapshot.context.breadcrumbs,
  }))
  const portalProps = useMantinePortalProps()

  const breadcrumbs = breadcrumbsItems.map((s) => {
    switch (s.type) {
      case 'folder': {
        return (
          <UnstyledButton
            key={s.folderPath}
            className={breadcrumbTitle({ dimmed: true, truncate: true })}
            title={s.title}
            onMouseEnter={() => actor.send({ type: 'breadcrumbs.mouseEnter.folder', folderPath: s.folderPath })}
            onClick={e => {
              e.stopPropagation()
              actor.send({ type: 'breadcrumbs.click.folder', folderPath: s.folderPath })
            }}
          >
            {s.title}
          </UnstyledButton>
        )
      }
      case 'viewtitle': {
        return (
          <UnstyledButton
            key={'viewtitle'}
            className={breadcrumbTitle({ truncate: true })}
            maw={300}
            title={s.title}
            onMouseEnter={() => actor.send({ type: 'breadcrumbs.mouseEnter.viewtitle' })}
            onClick={e => {
              e.stopPropagation()
              actor.send({ type: 'breadcrumbs.click.viewtitle' })
            }}
          >
            {s.title}
          </UnstyledButton>
        )
      }
      default:
        nonexhaustive(s)
    }
  })

  return (
    <Popover
      offset={{
        mainAxis: 4,
      }}
      opened={opened}
      shadow="md"
      position="bottom-start"
      trapFocus
      clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
      onDismiss={() => actor.send({ type: 'dropdown.dismiss' })}
      {...portalProps}>
      <PopoverTarget>
        <HStack
          layerStyle="likec4.panel"
          gap={1}
          cursor="pointer"
          paddingRight="md"
          onMouseLeave={() => actor.send({ type: 'breadcrumbs.mouseLeave' })}
        >
          <RootFolderBtn
            key="root"
            onMouseEnter={e => {
              actor.send({ type: 'breadcrumbs.mouseEnter.root' })
            }}
            onClick={e => {
              e.stopPropagation()
              actor.send({ type: 'breadcrumbs.click.root' })
            }}
          />
          {breadcrumbs.flatMap((s, index) => [
            <BreadcrumbsSeparator key={`separator-${index}`} />,
            s,
          ])}
        </HStack>
      </PopoverTarget>
      <DiagramBreadcrumbsDropdown />
    </Popover>
  )
}

const RootFolderBtn = Burger.withProps({
  size: 'xs',
  mr: 'var(--spacing-2)',
  className: css({
    '--burger-color': {
      base: '{colors.mantine.colors.dimmed}',
      _hover: '{colors.mantine.colors.text}',
    },
  }),
})
