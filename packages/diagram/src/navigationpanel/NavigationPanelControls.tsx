import { css, cx } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import {
  UnstyledButton,
} from '@mantine/core'
import { useSelector } from '@xstate/react'
import { deepEqual } from 'fast-equals'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { BreadcrumbsSeparator } from './_common'
import { type NavigationPanelActorSnapshot } from './actor'
import { BurgerButton, NavigationButtons, OpenSource, SearchControl, ToggleReadonly, ViewDetailsCard } from './controls'
import { useNavigationActor, useNavigationActorRef } from './hooks'
import { breadcrumbTitle } from './styles.css'
import { StartWalkthroughButton } from './walkthrough'

const selectBreadcrumbs = ({ context }: NavigationPanelActorSnapshot) => {
  const folder = context.viewModel.folder
  return {
    folders: folder.isRoot ? [] : folder.breadcrumbs.map(s => ({
      folderPath: s.path,
      title: s.title,
    })),
    viewId: context.viewModel.id,
    viewTitle: context.viewModel.titleOrUntitled,
    isDynamicView: context.viewModel.isDynamicView(),
  }
}

export const NavigationPanelControls = () => {
  const actor = useNavigationActor()
  const {
    enableSearch,
    enableNavigationButtons,
    enableDynamicViewWalkthrough,
    enableReadOnly,
  } = useEnabledFeatures()
  const {
    folders,
    viewTitle,
    isDynamicView,
  } = useSelector(actor.actorRef, selectBreadcrumbs, deepEqual)

  const folderBreadcrumbs = folders.flatMap(({ folderPath, title }, i) => [
    <UnstyledButton
      key={folderPath}
      component={m.button}
      className={cx(
        breadcrumbTitle({ dimmed: true, truncate: true }),
        'mantine-active',
        css({
          maxWidth: '200px',
          display: {
            base: 'none',
            '@/md': 'block',
          },
        }),
      )}
      title={title}
      onMouseEnter={() => actor.send({ type: 'breadcrumbs.mouseEnter.folder', folderPath })}
      onMouseLeave={() => actor.send({ type: 'breadcrumbs.mouseLeave.folder', folderPath })}
      onClick={e => {
        e.stopPropagation()
        actor.selectFolder(folderPath)
      }}
    >
      {title}
    </UnstyledButton>,
    <BreadcrumbsSeparator key={`separator-${i}`} />,
  ])

  const viewBreadcrumb = (
    <UnstyledButton
      key={'view-title'}
      component={m.button}
      className={cx(
        'mantine-active',
        breadcrumbTitle({ truncate: true }),
      )}
      title={viewTitle}
      onMouseEnter={() => actor.send({ type: 'breadcrumbs.mouseEnter.viewtitle' })}
      onMouseLeave={() => actor.send({ type: 'breadcrumbs.mouseLeave.viewtitle' })}
      onClick={e => {
        e.stopPropagation()
        actor.send({ type: 'breadcrumbs.click.viewtitle' })
      }}
    >
      {viewTitle}
    </UnstyledButton>
  )

  return (
    <AnimatePresence propagate>
      <BurgerButton key="burger-button" />
      {enableNavigationButtons && <NavigationButtons key="nav-buttons" />}
      <m.div
        key="breadcrumbs"
        layout="position"
        className={hstack({
          gap: 3,
          flexShrink: 1,
          flexGrow: 1,
          overflow: 'hidden',
        })}>
        {folderBreadcrumbs}
        {viewBreadcrumb}
      </m.div>
      <m.div
        key="actions"
        layout="position"
        className={hstack({
          gap: 1,
          flexGrow: 0,
          _empty: {
            display: 'none',
          },
        })}>
        <ViewDetailsCard
          onOpen={() => actor.closeDropdown()}
        />
        <OpenSource />
        <ToggleReadonly />
      </m.div>
      {enableDynamicViewWalkthrough && isDynamicView && <StartWalkthroughButton key="walkthrough-button" />}
      {enableSearch && <SearchControl key="search-control" />}
    </AnimatePresence>
  )
}
