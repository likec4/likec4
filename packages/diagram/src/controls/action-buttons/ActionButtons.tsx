import type { Fqn } from "@likec4/core"
import { useCallback } from "react"
import { useDiagramState, useDiagramStoreApi } from "../../hooks"
import { ActionButton } from "./ActionButton"
import { IconFileSymlink, IconId, IconTransform, IconZoomScan } from "@tabler/icons-react"

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

export const NavigateToButton = ({
  fqn
}: NodeActionButtonProps) => {

  const {
    triggerOnNavigateTo
  } = useDiagramState(s => ({
    triggerOnNavigateTo: s.triggerOnNavigateTo
  }))

  const onNavigateTo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    triggerOnNavigateTo(fqn, e)
  }, [triggerOnNavigateTo, fqn])

  return (
    <ActionButton
      onClick={onNavigateTo}
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
