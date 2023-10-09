/* eslint-disable */
import { keys } from 'rambdax'
import { LikeC4Views as GeneratedViews } from './likec4.generated'

export let LikeC4Views = GeneratedViews

export let LikeC4ViewIds = keys(GeneratedViews)

export type { LikeC4ViewId } from './likec4.generated'

if (import.meta.hot) {
  import.meta.hot.accept('./likec4.generated', next => {
    if (next && next['LikeC4Views']) {
      Object.assign(LikeC4Views, next['LikeC4Views'])
      LikeC4ViewIds = keys(next['LikeC4Views']) as any
    }
  })
}
