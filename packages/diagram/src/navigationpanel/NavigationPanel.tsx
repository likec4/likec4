import { cx } from '@likec4/styles/css'
import { HStack } from '@likec4/styles/jsx'
import {
  Button,
  Popover,
  PopoverTarget,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { useUpdateEffect } from '@react-hookz/web'
import {
  IconInfoCircleFilled,
  IconInfoSquareRounded,
  IconLink,
  IconMenu2,
  IconPlayerPlayFilled,
} from '@tabler/icons-react'
import { useActorRef, useSelector } from '@xstate/react'
import { deepEqual } from 'fast-equals'
import * as m from 'motion/react-m'
import { memo, useEffect } from 'react'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { useDiagramActorRef } from '../hooks/safeContext'
import { useDiagram } from '../hooks/useDiagram'
import { useCurrentViewModel } from '../likec4model/useCurrentViewModel'
import { BreadcrumbsSeparator, PanelActionIcon } from './_common'
import { type NavigationPanelActorRef, type NavigationPanelActorSnapshot, navigationPanelActorLogic } from './actor'
import { NavigationPanelActorContextProvider, useNavigationActor } from './hooks'
import { NavigationButtons } from './NavigationButtons'
import { NavigationPanelDropdown } from './NavigationPanelDropdown'
import { SearchControl } from './SearchControl'
import { breadcrumbTitle } from './styles.css'

export const NavigationPanel = memo(() => {
  const diagramActor = useDiagramActorRef()
  const viewModel = useCurrentViewModel()

  const actorRef = useActorRef(
    navigationPanelActorLogic,
    {
      input: {
        viewModel,
      },
    },
  )
  useEffect(() => {
    const subscription = actorRef.on('trigger.navigateTo', (event) => {
      if (diagramActor.getSnapshot().context.view.id !== event.viewId) {
        diagramActor.send({ type: 'navigate.to', viewId: event.viewId })
      }
    })
    return () => subscription.unsubscribe()
  }, [actorRef, diagramActor])

  useUpdateEffect(() => {
    actorRef.send({ type: 'update.inputs', inputs: { viewModel } })
  }, [viewModel])

  return (
    <NavigationPanelActorContextProvider value={actorRef}>
      <NavigationPanelImpl actor={actorRef} />
    </NavigationPanelActorContextProvider>
  )
})
NavigationPanel.displayName = 'DiagramBreadcrumbs'

const NavigationPanelImpl = ({ actor }: { actor: NavigationPanelActorRef }) => {
  const opened = useSelector(actor, s => s.hasTag('active'))
  // const portalProps = useMantinePortalProps()

  return (
    <Popover
      offset={{
        mainAxis: 4,
      }}
      middlewares={{ flip: false }}
      opened={opened}
      shadow="md"
      position="bottom-start"
      trapFocus
      withinPortal={false}
      clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
      onDismiss={() => actor.send({ type: 'dropdown.dismiss' })}
    >
      <NavigationPanelPopoverTarget actor={actor} />
      <NavigationPanelDropdown />
    </Popover>
  )
}

const selectBreadcrumbs = ({ context }: NavigationPanelActorSnapshot) => {
  const folder = context.viewModel.folder
  return {
    folders: folder.isRoot ? [] : folder.breadcrumbs.map(s => ({
      path: s.path,
      title: s.title,
    })),
    viewTitle: context.viewModel.titleOrUntitled,
    isDynamicView: context.viewModel.isDynamicView(),
    hasLinks: context.viewModel.links.length > 0,
    //   id: context.viewModel.id,
    //   path: context.viewModel.viewPath,
    //   title: context.viewModel.titleOrUntitled,
    //   type: context.viewModel._type,
    // },
  }
}

const NavigationPanelPopoverTarget = ({ actor }: { actor: NavigationPanelActorRef }) => {
  const {
    enableSearch,
    enableNavigationButtons,
    enableDynamicViewWalkthrough,
  } = useEnabledFeatures()
  const {
    folders,
    viewTitle,
    isDynamicView,
  } = useSelector(actor, selectBreadcrumbs, deepEqual)

  const folderBreadcrumbs = folders.flatMap((f, i) => [
    <UnstyledButton
      key={f.path}
      className={cx(
        breadcrumbTitle({ dimmed: true, truncate: true }),
        'mantine-active',
      )}
      title={f.title}
      onMouseEnter={() => actor.send({ type: 'breadcrumbs.mouseEnter.folder', folderPath: f.path })}
      onClick={e => {
        e.stopPropagation()
        actor.send({ type: 'breadcrumbs.click.folder', folderPath: f.path })
      }}
    >
      {f.title}
    </UnstyledButton>,
    <BreadcrumbsSeparator key={`separator-${i}`} />,
  ])

  const viewBreadcrumb = (
    <UnstyledButton
      key={'view-title'}
      className={cx(
        breadcrumbTitle({ truncate: true }),
        'mantine-active',
      )}
      maw={300}
      title={viewTitle}
      onMouseEnter={() => actor.send({ type: 'breadcrumbs.mouseEnter.viewtitle' })}
      onClick={e => {
        e.stopPropagation()
        actor.send({ type: 'breadcrumbs.click.viewtitle' })
      }}
    >
      {viewTitle}
    </UnstyledButton>
  )

  return (
    <PopoverTarget>
      <HStack
        layerStyle="likec4.panel"
        gap={'xs'}
        cursor="pointer"
        paddingRight="md"
        onMouseLeave={() => actor.send({ type: 'breadcrumbs.mouseLeave' })}
      >
        <PanelActionIcon
          variant="subtle"
          component={m.button}
          whileHover={{
            scale: 1.085,
          }}
          whileTap={{
            scale: 1,
            translateY: 1,
          }}
          onMouseEnter={e => {
            actor.send({ type: 'breadcrumbs.mouseEnter.root' })
          }}
          onClick={e => {
            e.stopPropagation()
            actor.send({ type: 'breadcrumbs.click.root' })
          }}
          children={<IconMenu2 style={{ width: '80%', height: '80%' }} />}
        />
        {enableNavigationButtons && <NavigationButtons />}
        <HStack gap={3} mr={'md'}>
          {folderBreadcrumbs}
          {viewBreadcrumb}
        </HStack>
        {
          /* <HStack gap={1}>
          <PanelActionIcon
            variant="subtle"
            size={24}
            component={m.button}
            whileHover={{
              scale: 1.085,
            }}
            whileTap={{
              scale: 1,
              translateY: 1,
            }}
            children={<IconInfoCircleFilled style={{ width: '85%', height: '85%' }} />}
          />
          <PanelActionIcon
            variant="subtle"
            size={24}
            component={m.button}
            whileHover={{
              scale: 1.085,
            }}
            whileTap={{
              scale: 1,
              translateY: 1,
            }}
            children={<IconLink style={{ width: '85%', height: '85%' }} />}
          />
        </HStack> */
        }

        {enableDynamicViewWalkthrough && isDynamicView && <DynamicViewWalkthrough />}
        {enableSearch && <SearchControl />}
      </HStack>
    </PopoverTarget>
  )
}

const DynamicViewWalkthrough = () => {
  const diagram = useDiagram()
  const actor = useNavigationActor()
  return (
    <Tooltip
      label="Start Dynamic View Walkthrough"
      offset={10}
      openDelay={300}
      color="dark"
    >
      <Button
        variant="filled"
        size="xs"
        fw="500"
        onClick={e => {
          e.stopPropagation()
          actor.closeDropdown()
          diagram.startWalkthrough()
        }}
        rightSection={<IconPlayerPlayFilled size={10} />}
      >
        Start
      </Button>
    </Tooltip>
  )
}
