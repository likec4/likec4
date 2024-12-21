import type { Fqn, ViewId } from "@likec4/core"
import { useCallback } from "react"
import { useDiagramState, useDiagramStoreApi } from "../../hooks"
import { ActionButton } from "./ActionButton"
import { IconFileSymlink, IconId, IconTransform, IconZoomScan } from "@tabler/icons-react"
import { useOverlayDialog } from "../../overlays/OverlayContext"

export type NodeActionButtonProps = {
  fqn: Fqn
}

// Browse Relationships

export const BrowseRelationshipsButton = ({
  fqn
}: NodeActionButtonProps) => {

  const {
    openOverlay
  } = useDiagramState(s => ({
    openOverlay: s.openOverlay
  }))

  const onBrowseRelationships = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    openOverlay({ relationshipsOf: fqn })
  }, [openOverlay, fqn])

  return (
    <ActionButton
      onClick={onBrowseRelationships}
      IconComponent={IconTransform}
      tooltipLabel='Browse relationships'
      />
  )
}

// Navigate to

export type NavigateToButtonProps = {
  fqn?: Fqn
  viewId?: ViewId
}

export const NavigateToButton = ({
  fqn,
  viewId
}: NavigateToButtonProps) => {

  // call hooks in case we are in an overlay
  const overlay = useOverlayDialog()
  const {
    onNavigateTo,
    triggerOnNavigateTo
  } = useDiagramState(s => ({
    onNavigateTo: s.onNavigateTo,
    triggerOnNavigateTo: s.triggerOnNavigateTo
  }))

  let onClick: (e: React.MouseEvent) => void

  // in diagram
  if (fqn) {
    onClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      triggerOnNavigateTo(fqn, e)
    }
  }

  // in overlay
  else if (viewId && onNavigateTo) {
    onClick = (event) => {
      event.stopPropagation()
      overlay.close(() => onNavigateTo(viewId))
    }
  } else {
    return null
  }

  return (
    <ActionButton
      onClick={onClick}
      IconComponent={IconZoomScan}
      tooltipLabel='Open scoped view'
      />
  )
}

// Open details

export const OpenDetailsButton = ({
  fqn
}: NodeActionButtonProps) => {

  const {
    openOverlay
  } = useDiagramState(s => ({
    openOverlay: s.openOverlay
  }))

  const onOpenDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    openOverlay({ elementDetails: fqn })
  }, [openOverlay, fqn])

  return (
    <ActionButton
      onClick={onOpenDetails}
      IconComponent={IconId}
      tooltipLabel='Open details'
      />
  )
}

// Open element source

export const OpenSourceButton = ({
  fqn
}: NodeActionButtonProps) => {

  const diagramApi = useDiagramStoreApi()

  const onOpenSource = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    diagramApi.getState().onOpenSource?.({
      element: fqn
    })
  }, [diagramApi.getState(), fqn])

  return (
    <ActionButton
      onClick={onOpenSource}
      IconComponent={IconFileSymlink}
      tooltipLabel='Open source'
      />
  )
}
