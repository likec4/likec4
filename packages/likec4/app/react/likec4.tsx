import type { ViewId } from 'likec4/model'
import { $likec4data, $likec4model } from 'likec4:single-project'

export const likec4model = $likec4model.get()

export {
  IconRenderer as RenderIcon,
  useLikeC4Model,
  useLikeC4View,
} from 'likec4:single-project'

export {
  LikeC4ModelProvider,
  LikeC4View,
  ReactLikeC4,
} from 'likec4:react'

export function isLikeC4ViewId(value: unknown): value is ViewId {
  const model = $likec4data.get()
  return (
    value != null
    && typeof value === 'string'
    && !!model.views[value]
  )
}
