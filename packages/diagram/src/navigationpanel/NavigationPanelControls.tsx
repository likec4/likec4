import { extractViewTitleFromPath } from '@likec4/core/model'
import { css, cx } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import {
  UnstyledButton,
} from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { LayoutGroup } from 'motion/react'
import * as m from 'motion/react-m'
import { memo } from 'react'
import { isTruthy } from 'remeda'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { useOptionalCurrentViewModel } from '../hooks/useCurrentViewModel'
import { selectDiagramContext, useDiagramSelector } from '../hooks/useDiagram'
import { deriveToggledFeatures } from '../likec4diagram/state/machine.setup'
import {
  LayoutWarning,
  LogoButton,
  NavigationButtons,
  OpenSource,
  SearchControl,
  ToggleReadonly,
  ViewDetailsButton,
} from './controls'
import { ElementViewControls } from './ElementViewControls'
import { useNavigationActor } from './hooks'
import { breadcrumbTitle } from './styles.css'
import { DynamicViewControls } from './walkthrough'

const selectViewData = selectDiagramContext(s => {
  const toggledFeatures = deriveToggledFeatures(s)

  // Disable readonly toggle, if any of these conditions is true:
  const comparingLatest = toggledFeatures.enableCompareWithLatest && !!s.view.drifts && s.view._layout === 'auto'
  // const sequenceLayoutActive = ctx.view._type === 'dynamic' && ctx.dynamicViewVariant === 'sequence'

  // If All condition is true, we show toggle
  const noActiveWalkthrough = !isTruthy(s.activeWalkthrough)
  const hasEditor = s.features.enableEditor

  const isReadOnly = s.toggledFeatures.enableReadOnly ?? false

  return ({
    viewId: s.view.id,
    viewTitle: (s.view.title && extractViewTitleFromPath(s.view.title)) ?? 'Untitled View',
    isDynamicView: s.view._type === 'dynamic',
    isElementView: s.view._type === 'element',
    editBtnVisible: hasEditor && noActiveWalkthrough,
    editBtnDisabled: comparingLatest,
    isReadOnly,
  })
})

const breadcrumbAnimation = {
  initial: { opacity: 0.5, translateX: -10, translateY: 0 },
  animate: { opacity: 1, translateX: 0, translateY: 0 },
  exit: { opacity: 0, translateX: -10, translateY: 0 },
  whileTap: {
    translateY: 1,
  },
}

export const NavigationPanelControls = memo(() => {
  const actor = useNavigationActor()
  const {
    enableNavigationButtons,
    enableDynamicViewWalkthrough,
    enableCompareWithLatest,
    enableSearch,
    enableVscode,
  } = useEnabledFeatures()
  const viewModel = useOptionalCurrentViewModel()
  const {
    editBtnDisabled,
    editBtnVisible,
    isReadOnly,
    viewTitle,
    isDynamicView,
    isElementView,
  } = useDiagramSelector(selectViewData)

  const folder = viewModel?.folder
  const folders = !folder || folder.isRoot ? [] : folder.breadcrumbs.map(s => ({
    folderPath: s.path,
    title: s.title,
  }))

  const folderBreadcrumbs = folders.flatMap(({ folderPath, title }, index, all) => [
    <UnstyledButton
      key={folderPath}
      component={m.button}
      layout="position"
      className={cx(
        breadcrumbTitle({ dimmed: true, truncate: true }),
        // 'mantine-active',
        css({
          userSelect: 'none',
          maxWidth: '[150px]',
          display: {
            base: 'none',
            '@/md': 'block',
          },
        }),
      )}
      {...breadcrumbAnimation}
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
    <m.div
      key={folderPath + '-separator'}
      layout
      className={css({
        display: {
          base: 'none',
          '@/md': 'block',
        },
        color: 'text.non-essential',
      })}>
      <IconChevronRight size={16} />
    </m.div>,
  ])

  const viewBreadcrumb = (
    <UnstyledButton
      layoutId={'view-title'}
      component={m.button}
      layout="position"
      {...breadcrumbAnimation}
      className={cx(
        // 'mantine-active',
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
    <>
      <LogoButton key="logo-button" />
      {enableNavigationButtons && <NavigationButtons key="nav-buttons" />}

      <m.div
        key="breadcrumbs"
        layout="size"
        className={hstack({
          gap: '1',
          flexShrink: 1,
          flexGrow: 1,
          flexWrap: 'nowrap',
          overflow: 'hidden',
        })}>
        <LayoutGroup id="navigation-panel-breadcrumbs">
          {folderBreadcrumbs}
          {viewBreadcrumb}
        </LayoutGroup>
      </m.div>

      <m.div
        key="actions"
        layout="size"
        className={hstack({
          gap: '1.5',
          flexShrink: 0,
          flexWrap: 'nowrap',
          flexGrow: 0,
        })}>
        <ViewDetailsButton key="details" onOpen={() => actor.closeDropdown()} />
        {enableVscode && <OpenSource key="open-source" />}
        {editBtnVisible && <ToggleReadonly key="toggle-readonly" disabled={editBtnDisabled} isReadOnly={isReadOnly} />}
        {enableDynamicViewWalkthrough && isDynamicView && <DynamicViewControls key="dynamic-view-controls" />}
        {isElementView && <ElementViewControls key="element-view-controls" />}
        {enableSearch && !enableCompareWithLatest && <SearchControl key="search-control" />}
        <LayoutWarning key="outdated-manual-layout-warning" />
      </m.div>
    </>
  )
})
NavigationPanelControls.displayName = 'NavigationPanelControls'
