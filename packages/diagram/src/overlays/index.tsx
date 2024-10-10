import { useDiagramState } from '../hooks/useDiagramState'
import { EdgeDetailsOverlay } from './edge-details/EdgeDetailsOverlay'
import { RelationshipsOfOverlay } from './relationships-of/RelationshipsOfOverlay'

export function Overlays() {
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
    return <RelationshipsOfOverlay elementId={activeOverlay.relationshipsOf} />
  }

  if (activeOverlay.edgeDetails) {
    return <EdgeDetailsOverlay edgeId={activeOverlay.edgeDetails} />
  }

  return null
}
