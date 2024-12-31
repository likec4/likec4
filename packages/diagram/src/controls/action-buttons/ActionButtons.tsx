import type { Fqn } from '@likec4/core'
import { IconFileSymlink, IconId, IconTransform, IconZoomScan } from '@tabler/icons-react'
import { useCallback } from 'react'
import { useDiagramState, useDiagramStoreApi } from '../../hooks'
import { ActionButton } from './ActionButton'

export type NodeActionButtonProps = {
  fqn: Fqn
}

// Browse Relationships

export const BrowseRelationshipsButton = ({
  fqn,
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
      onClick={onBrowseRelationships}
      IconComponent={IconTransform}
      tooltipLabel="Browse relationships"
    />
  )
}

// Navigate to
// It triggers the onNavigateTo event from the xynode (node should have a navigateTo property)
export type NavigateToButtonProps = {
  xynodeId: string
}
export const NavigateToButton = ({
  xynodeId,
}: NavigateToButtonProps) => {
  const store = useDiagramStoreApi()

  const onNavigateTo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    store.getState().triggerOnNavigateTo(xynodeId, e)
  }, [store, xynodeId])

  return (
    <ActionButton
      onClick={onNavigateTo}
      IconComponent={IconZoomScan}
      tooltipLabel="Open scoped view"
    />
  )
}

// Open details

export const OpenDetailsButton = ({
  fqn,
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
      onClick={onOpenDetails}
      IconComponent={IconId}
      tooltipLabel="Open details"
    />
  )
}

// Open element source

export const OpenSourceButton = ({
  fqn,
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
      onClick={onOpenSource}
      IconComponent={IconFileSymlink}
      tooltipLabel="Open source"
    />
  )
}
