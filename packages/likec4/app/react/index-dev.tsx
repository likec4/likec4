import { createRoot } from 'react-dom/client'
import { type LikeC4ViewId } from 'virtual:likec4/views'
import { LikeC4View } from './likec4'

const viewId = (window.location.hash || '#index').slice(1) as LikeC4ViewId

createRoot(document.getElementById('likec4-root')!).render(
  <LikeC4View viewId={viewId} />
)
