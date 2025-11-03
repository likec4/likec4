import { extractViewTitleFromPath } from '@likec4/core/model'
import { css, cx } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import {
  UnstyledButton,
} from '@mantine/core'
import { useSelector } from '@xstate/react'
import { deepEqual } from 'fast-equals'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { memo } from 'react'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { BreadcrumbsSeparator } from './_common'
import type { NavigationPanelActorSnapshot } from './actor'
import {
  BurgerButton,
  DetailsControls,
  LayoutWarning,
  NavigationButtons,
  OpenSource,
  SearchControl,
  ToggleReadonly,
} from './controls'
import { useNavigationActor } from './hooks'
import { breadcrumbTitle } from './styles.css'
import { DynamicViewControls } from './walkthrough'

const selectBreadcrumbs = ({ context }: NavigationPanelActorSnapshot) => {
  const view = context.view
  const folder = context.viewModel?.folder
  return {
    folders: !folder || folder.isRoot ? [] : folder.breadcrumbs.map(s => ({
      folderPath: s.path,
      title: s.title,
    })),
    viewId: view.id,
    viewTitle: context.viewModel?.title ?? (view.title && extractViewTitleFromPath(view.title)) ?? 'Untitled View',
    isDynamicView: (context.viewModel?._type ?? view._type) === 'dynamic',
  }
}

export const NavigationPanelControls = memo(() => {
  const actor = useNavigationActor()
  const {
    enableNavigationButtons,
    enableDynamicViewWalkthrough,
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
          userSelect: 'none',
          maxWidth: '200px',
          display: {
            base: 'none',
            '@/md': 'block',
          },
        }),
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      title={title}
      onMouseEnter={() => actor.send({ type: 'breadcrumbs.mouseEnter.folder', folderPath })}
      onMouseLeave={() => actor.send({ type: 'breadcrumbs.mouseLeave.folder', folderPath })}
      onClick={e => {
        e.stopPropagation()
        actor.send({ type: 'breadcrumbs.click.folder', folderPath })
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cx(
        'mantine-active',
        breadcrumbTitle({ truncate: true }),
        css({
          userSelect: 'none',
        }),
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
    <AnimatePresence propagate mode="popLayout">
      <BurgerButton key="burger-button" />
      {enableNavigationButtons && <NavigationButtons key="nav-buttons" />}
      <m.div
        key="breadcrumbs"
        layout="position"
        className={hstack({
          gap: '1',
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
          gap: '0.5',
          flexGrow: 0,
          _empty: {
            display: 'none',
          },
        })}>
        <DetailsControls onOpen={() => actor.closeDropdown()} />
        <OpenSource />
        <ToggleReadonly />
      </m.div>
      {enableDynamicViewWalkthrough && isDynamicView && <DynamicViewControls key="dynamic-view-controls" />}
      <SearchControl key="search-control" />
      <LayoutWarning key="outdated-manual-layout-warning" />
    </AnimatePresence>
  )
})
NavigationPanelControls.displayName = 'NavigationPanelControls'
