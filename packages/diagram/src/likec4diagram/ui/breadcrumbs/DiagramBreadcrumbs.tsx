import { type LikeC4ViewModel, LikeC4ViewsGroup } from '@likec4/core/model'
import { css } from '@likec4/styles/css'
import { HStack } from '@likec4/styles/jsx'
import {
  Badge,
  Burger,
  Button,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import { IconChevronRight, IconFolder, IconStack2, IconZoomScan } from '@tabler/icons-react'
import { AnimatePresence } from 'motion/react'
import { Fragment } from 'react'
import { ElementTag } from '../../../base/primitives'
import { useMantinePortalProps } from '../../../hooks/useMantinePortalProps'
import { useCurrentViewModel } from '../../../likec4model'
import type { DiagramContext } from '../../../state/types'

function selector(context: DiagramContext) {
  return {
    // id: context.view.id,
    // title: context.view.title ?? 'untitled',
    // description: RichText.from(context.view.description),
    // links: context.view.links,
    isNotActiveWalkthrough: context.activeWalkthrough === null,
  }
}

export function DiagramBreadcrumbs() {
  const view = useCurrentViewModel()
  const breadcrumbs = view.breadcrumbs

  return (
    <AnimatePresence mode="wait">
      <HStack gap={'0'}>
        {breadcrumbs.map((segment, index, all) => {
          if (segment instanceof LikeC4ViewsGroup) {
            return (
              <Fragment key={index}>
                <ViewsGroupSegment group={segment} next={all[index + 1]!} />
                <ThemeIcon variant="transparent" size={'sm'} color="gray">
                  <IconChevronRight />
                </ThemeIcon>
              </Fragment>
            )
          }
          return <CurrentViewSegment key={index} view={segment} />
        })}
      </HStack>
    </AnimatePresence>
  )
}

const Btn = Button.withProps({
  variant: 'subtle',
  color: 'gray',
  fullWidth: true,
  size: 'md',
  styles: {
    inner: {
      justifyContent: 'flex-start',
    },
    label: {
      flex: 1,
    },
  },
})

function ViewsGroupSegment({ group, next }: { group: LikeC4ViewsGroup; next: LikeC4ViewModel | LikeC4ViewsGroup }) {
  const portalProps = useMantinePortalProps()
  return (
    <HoverCard
      shadow="md"
      initiallyOpened={group.title === 'Context'}
      position="bottom-start"
      {...portalProps}>
      <HoverCardTarget>
        {group.isRoot
          ? <Burger size={'sm'} />
          : (
            <UnstyledButton fz="sm" fw="500" c="dimmed">
              {group.title}
            </UnstyledButton>
          )}
      </HoverCardTarget>
      <HoverCardDropdown p="0">
        <Button.Group orientation="vertical">
          {group.groups.map((child, index) => (
            <Btn
              leftSection={<IconFolder size={14} />}
              rightSection={<IconChevronRight size={14} />}
              key={'group-' + index}>
              {child.title}
            </Btn>
          ))}
          {group.views.map((child, index) => (
            <Btn
              key={'view-' + index}
              leftSection={child.isDeploymentView()
                ? <IconStack2 stroke={1.8} size={14} />
                : <IconZoomScan stroke={1.8} size={14} />}
            >
              {child.title ?? child.id}
            </Btn>
          ))}
        </Button.Group>
      </HoverCardDropdown>
    </HoverCard>
    // <Menu trigger="click-hover" position="bottom-start" closeDelay={600} {...portalProps}>
    //   <Menu.Target>
    //     <UnstyledButton>
    //       {group.title}
    //     </UnstyledButton>
    //   </Menu.Target>
    //   <Menu.Dropdown>
    //     {[...group.children].map((child, index) => (
    //       <Menu.Item key={index}>
    //         {child.title}
    //       </Menu.Item>
    //     ))}
    //   </Menu.Dropdown>
    // </Menu>
  )
}

function CurrentViewSegment({ view }: { view: LikeC4ViewModel }) {
  const portalProps = useMantinePortalProps()
  return (
    <HoverCard
      shadow="md"
      position="bottom-start"
      {...portalProps}>
      <HoverCardTarget>
        <UnstyledButton fz="md" fw="500">
          {view.title ?? view.id}
        </UnstyledButton>
      </HoverCardTarget>
      <HoverCardDropdown>
        <HStack alignItems="baseline">
          <Badge color="gray" variant="light" size="xs" radius="xs">id:{view.id}</Badge>
          <HStack
            alignItems="center"
            css={{
              gap: 4,
              flexWrap: 'wrap',
              pb: 'sm',
              // translate: 'auto',
              // x: -8,
            }}
          >
            {view.tags.map((tag) => (
              <ElementTag
                key={tag}
                tag={tag}
                className={css({
                  userSelect: 'none',
                  cursor: 'pointer',
                  // ...(zoomIsLargeEnough && {
                  //   fontSize: 'lg',
                  //   borderRadius: 4,
                  //   px: 6,
                  // }),
                })}
                // onClick={e => {
                //   e.stopPropagation()
                //   diagram.openSearch(`#${tag}`)
                // }}
                // onMouseEnter={() => onHover(tag)}
                // onMouseLeave={onLeave}
              />
            ))}
          </HStack>
          {/* <Badge color="gray">{view.title}</Badge> */}
        </HStack>
      </HoverCardDropdown>
    </HoverCard>
  )
}
