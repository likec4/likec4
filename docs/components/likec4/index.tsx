
import type { LikeC4DiagramProps } from './LikeC4Diagram'
import dynamic from 'next/dynamic'

const NoSSRLikeC4View = dynamic(
  () => import('./LikeC4Diagram'),
  {
    loading: () => <div>loading...</div>,
    ssr: false,
  }
)

export function LikeC4View(props: LikeC4DiagramProps) {
  return <NoSSRLikeC4View {...props}
  />
}
