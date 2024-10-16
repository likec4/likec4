import { memo } from 'react'
import { useDiagramState } from '../hooks/useDiagramState'
import { EdgeDetailsOverlay } from './edge-details/EdgeDetailsOverlay'
import { RelationshipsOfOverlay } from './relationships-of/RelationshipsOverlay'

export const Overlays = memo(() => {
  const {
    hasLikeC4Model,
    activeOverlay
  } = useDiagramState(s => ({
    hasLikeC4Model: s.hasLikeC4Model,
    activeOverlay: s.activeOverlay
  }))

  if (!activeOverlay) {
    return null
  }

  if (!hasLikeC4Model) {
    console.warn('LikeC4Model is not available, but overlays are active')
    return null
  }

  if (activeOverlay.relationshipsOf) {
    return <RelationshipsOfOverlay />
  }

  if (activeOverlay.edgeDetails) {
    return <EdgeDetailsOverlay edgeId={activeOverlay.edgeDetails} />
  }

  return null
})
