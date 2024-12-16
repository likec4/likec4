import type { Fqn } from "@likec4/core"
import { useCallback } from "react"
import { useDiagramState } from "../../hooks"
import { ActionButton } from "./ActionButton"
import { IconId, IconZoomScan } from "@tabler/icons-react"

// Navigate to

export type NavigateToButtonProps = {
  fqn: Fqn
}

export const NavigateToButton = ({
  fqn
}: NavigateToButtonProps) => {

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

export type OpenDetailsButtonProps = {
  fqn: Fqn
}

export const OpenDetailsButton = ({
  fqn
}: OpenDetailsButtonProps) => {

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
