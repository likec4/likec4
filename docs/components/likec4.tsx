
import dynamic from 'next/dynamic'
import type { ViewId, LikeC4ViewProps } from '$/likec4/index'

const DynamicLikeC4View = dynamic(
  () => import('$/likec4/index').then(m => m.LikeC4View),
  {
    loading: () => <div>loading...</div>,
    ssr: false,
  }
)

export default function LikeC4(props: LikeC4ViewProps& { viewId: ViewId }) {
 return <DynamicLikeC4View {...props} />
}
