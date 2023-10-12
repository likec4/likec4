/* eslint-disable */
import { keys } from 'rambdax'
import { LikeC4Views as GeneratedViews } from './generated'

export const LikeC4Views = GeneratedViews

export const LikeC4ViewIds = keys(GeneratedViews)

export type { LikeC4ViewId } from './generated'

if (import.meta.hot) {
  import.meta.hot.accept('./generated', next => {
    if (next && next['LikeC4Views']) {
      Object.assign(LikeC4Views, next['LikeC4Views'])
      LikeC4ViewIds.length = 0
      LikeC4ViewIds.push(...(keys(next['LikeC4Views']) as any))
    }
  })
}
