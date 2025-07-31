import { HStack } from '@likec4/styles/jsx'
import {
  Divider,
  Popover,
  PopoverTarget,
  UnstyledButton,
} from '@mantine/core'
import { useUpdateEffect } from '@react-hookz/web'
import { useActorRef, useSelector } from '@xstate/react'
import { deepEqual } from 'fast-equals'
import { forwardRef, memo, useEffect } from 'react'
import { useDiagramActorRef } from '../hooks/safeContext'
import { useCurrentViewModel } from '../likec4model/useCurrentViewModel'
import { Breadcrumbs, RootActionIcon } from './_common'
import { type NavigationPanelActorRef, type NavigationPanelActorSnapshot, navigationPanelActorLogic } from './actor'
import { NavigationPanelActorContextProvider } from './hooks'
import { NavigationPanelDropdown } from './NavigationPanelDropdown'
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
      <PopoverTarget>
        <ViewBreadcrumbs actor={actor} />
      </PopoverTarget>
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
    //   id: context.viewModel.id,
    //   path: context.viewModel.viewPath,
    //   title: context.viewModel.titleOrUntitled,
    //   type: context.viewModel._type,
    // },
  }
}

const ViewBreadcrumbs = forwardRef<HTMLDivElement, { actor: NavigationPanelActorRef }>(({ actor }, ref) => {
  const {
    folders,
    viewTitle,
  } = useSelector(actor, selectBreadcrumbs, deepEqual)

  const folderBreadcrumbs = folders.map(f => (
    <UnstyledButton
      key={f.path}
      className={breadcrumbTitle({ dimmed: true, truncate: true })}
      title={f.title}
      onMouseEnter={() => actor.send({ type: 'breadcrumbs.mouseEnter.folder', folderPath: f.path })}
      onClick={e => {
        e.stopPropagation()
        actor.send({ type: 'breadcrumbs.click.folder', folderPath: f.path })
      }}
    >
      {f.title}
    </UnstyledButton>
  ))

  const viewBreadcrumb = (
    <UnstyledButton
      key={'view-title'}
      className={breadcrumbTitle({ truncate: true })}
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
    <HStack
      ref={ref}
      layerStyle="likec4.panel"
      gap={'2xs'}
      cursor="pointer"
      paddingRight="md"
      onMouseLeave={() => actor.send({ type: 'breadcrumbs.mouseLeave' })}
    >
      <RootActionIcon
        key="root"
        onMouseEnter={e => {
          actor.send({ type: 'breadcrumbs.mouseEnter.root' })
        }}
        onClick={e => {
          e.stopPropagation()
          actor.send({ type: 'breadcrumbs.click.root' })
        }} />
      {folderBreadcrumbs.length > 1 && <Divider orientation="vertical" />}
      <Breadcrumbs>
        {folderBreadcrumbs}
        {viewBreadcrumb}
      </Breadcrumbs>
    </HStack>
  )
})
