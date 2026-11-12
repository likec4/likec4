import { extractViewTitleFromPath } from '@likec4/core/model'
import { hstack } from '@likec4/styles/patterns'
import * as m from 'motion/react-m'
import { memo } from 'react'
import { isTruthy } from 'remeda'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { useOptionalCurrentViewModel } from '../hooks/useCurrentViewModel'
import { selectDiagramSnapshot, useDiagramSelector } from '../hooks/useDiagram'
import { isComparingLayouts } from '../likec4diagram/state/machine.setup'
import {
  LayoutWarning,
  LogoButton,
  NavigationButtons,
  OpenSource,
  SearchControl,
  ToggleReadonly,
  ViewDetailsButton,
} from './controls'
import { NavigationBreadcrumbs } from './controls/NavigationBreadcrumbs'
import { ElementViewControls } from './ElementViewControls'
import { useNavigationActor } from './hooks'
import { DynamicViewControls } from './walkthrough'

const selectViewData = selectDiagramSnapshot(snapshot => {
  const s = snapshot.context
  const isElementView = s.view._type === 'element'
  const isComparing = isComparingLayouts(snapshot)
  // Disable readonly toggle, if any of these conditions is true:
  const comparingLatest = isComparing && s.view._layout === 'auto'
  // const sequenceLayoutActive = ctx.view._type === 'dynamic' && ctx.dynamicViewVariant === 'sequence'

  const isGraphForceSimulation = isElementView && s.elementViewVariant === 'graph'

  // If All condition is true, we show toggle
  const noActiveWalkthrough = !isTruthy(s.activeWalkthrough)
  const hasEditor = s.features.enableEditor

  const isReadOnly = s.toggledFeatures.enableReadOnly ?? false
  const isEditing = !isReadOnly

  return ({
    viewId: s.view.id,
    linksCount: s.view.links?.length ?? 0,
    viewTitle: (s.view.title && extractViewTitleFromPath(s.view.title)) ?? 'Untitled View',
    isDynamicView: s.view._type === 'dynamic',
    isElementView: s.view._type === 'element',
    elementViewVariant: s.elementViewVariant,
    editBtnVisible: hasEditor && noActiveWalkthrough,
    editBtnDisabled: comparingLatest || isGraphForceSimulation,
    isReadOnly,
    isEditing,
    isComparing,
  })
})

export const NavigationPanelControls = memo(() => {
  const actor = useNavigationActor()
  const {
    enableNavigationButtons,
    enableDynamicViewWalkthrough,
    enableSearch,
    enableVscode,
  } = useEnabledFeatures()
  const viewModel = useOptionalCurrentViewModel()
  const {
    editBtnDisabled,
    editBtnVisible,
    isReadOnly,
    isEditing,
    viewTitle,
    isDynamicView,
    isElementView,
    elementViewVariant,
    linksCount,
    isComparing,
  } = useDiagramSelector(selectViewData)

  const hasModel = !!viewModel

  return (
    <>
      <LogoButton key="logo-button" />
      {enableNavigationButtons && <NavigationButtons key="nav-buttons" />}

      <NavigationBreadcrumbs
        key="breadcrumbs"
        viewTitle={viewTitle}
        viewModel={viewModel}
      />

      <m.div
        key="actions"
        layout="size"
        className={hstack({
          gap: '1.5',
          flexShrink: 0,
          flexWrap: 'nowrap',
          flexGrow: 0,
        })}>
        {hasModel && <ViewDetailsButton key="details" linksCount={linksCount} onOpen={() => actor.closeDropdown()} />}
        {enableVscode && <OpenSource key="open-source" />}
        {editBtnVisible && <ToggleReadonly key="toggle-readonly" disabled={editBtnDisabled} isReadOnly={isReadOnly} />}
        {enableDynamicViewWalkthrough && isDynamicView && <DynamicViewControls key="dynamic-view-controls" />}
        {isElementView && (
          <ElementViewControls
            key="element-view-controls"
            elementViewVariant={elementViewVariant}
            disabled={isComparing || isEditing} />
        )}
        {enableSearch && !isComparing && <SearchControl key="search-control" />}
        <LayoutWarning key="outdated-manual-layout-warning" />
      </m.div>
    </>
  )
})
NavigationPanelControls.displayName = 'NavigationPanelControls'
