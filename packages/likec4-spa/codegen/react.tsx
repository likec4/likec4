import type { LikeC4ViewId } from 'likec4:react'
import { $likec4model } from 'likec4:single-project'

export const likec4model = $likec4model.get()

export {
  IconRenderer as RenderIcon,
} from 'likec4:single-project'

export {
  LikeC4ModelProvider,
  LikeC4View,
  ReactLikeC4,
  useLikeC4Model,
  useLikeC4View,
} from 'likec4:react'

export function isLikeC4ViewId(value: unknown): value is LikeC4ViewId {
  return (
    value != null
    && typeof value === 'string'
    && !!likec4model.findView(value)
  )
}
