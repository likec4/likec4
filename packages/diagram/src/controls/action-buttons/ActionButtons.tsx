import type { Fqn } from '@likec4/core'
import { IconFileSymlink, IconId, IconTransform, IconZoomScan } from '@tabler/icons-react'
import { useCallback } from 'react'
import { useDiagramState, useDiagramStoreApi } from '../../hooks'
import { type ActionButtonProps, ActionButton } from './ActionButton'

export type NodeActionButtonProps = Omit<ActionButtonProps, 'onClick' | 'IconComponent' | 'tooltipLabel'> & {
  fqn: Fqn
}

// Browse Relationships

export const BrowseRelationshipsButton = ({
  fqn,
  ...props
}: NodeActionButtonProps) => {
  const {
    openOverlay,
  } = useDiagramState(s => ({
    openOverlay: s.openOverlay,
  }))

  const onBrowseRelationships = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    openOverlay({ relationshipsOf: fqn })
  }, [openOverlay, fqn])

  return (
    <ActionButton
      {...props}
      onClick={onBrowseRelationships}
      IconComponent={IconTransform}
      tooltipLabel="Browse relationships"
    />
  )
}

// Navigate to
// It triggers the onNavigateTo event from the xynode (node should have a navigateTo property)
export type NavigateToButtonProps = Omit<ActionButtonProps, 'onClick' | 'IconComponent' | 'tooltipLabel'> & {
  xynodeId: string
}
export const NavigateToButton = ({
  xynodeId,
  ...props
}: NavigateToButtonProps) => {
  const store = useDiagramStoreApi()

  const onNavigateTo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    store.getState().triggerOnNavigateTo(xynodeId, e)
  }, [store, xynodeId])

  return (
    <ActionButton
      {...props}
      onClick={onNavigateTo}
      IconComponent={IconZoomScan}
      tooltipLabel="Open scoped view"
    />
  )
}

// Open details
const VariantsDetailsBtn = {
  idle: {
    '--ai-bg': 'var(--ai-bg-idle)',
    scale: 1,
    opacity: 0.5,
    originX: 0.45,
    originY: 0.55,
  },
  selected: {},
  hovered: {
    scale: 1.2,
    opacity: 0.7,
  },
  'hovered:details': {
    scale: 1.44,
    opacity: 1,
  },
  'tap:details': {
    scale: 1.15,
  },
}
VariantsDetailsBtn['selected'] = VariantsDetailsBtn['hovered']

export const OpenDetailsButton = ({
  fqn,
  ...props
}: NodeActionButtonProps) => {
  const {
    openOverlay,
  } = useDiagramState(s => ({
    openOverlay: s.openOverlay,
  }))

  const onOpenDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    openOverlay({ elementDetails: fqn })
  }, [openOverlay, fqn])

  return (
    <ActionButton
      variants={VariantsDetailsBtn}
      onClick={onOpenDetails}
      IconComponent={IconId}
      tooltipLabel="Open details"
      data-animate-target="details"
      {...props}
    />
  )
}

// Open element source

export const OpenSourceButton = ({
  fqn,
  ...props
}: NodeActionButtonProps) => {
  const diagramApi = useDiagramStoreApi()

  const onOpenSource = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    diagramApi.getState().onOpenSource?.({
      element: fqn,
    })
  }, [diagramApi, fqn])

  return (
    <ActionButton
      {...props}
      onClick={onOpenSource}
      IconComponent={IconFileSymlink}
      tooltipLabel="Open source"
    />
  )
}
