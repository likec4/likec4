/* eslint-disable */
import { useStore } from '@nanostores/react'
import { map } from 'nanostores'
import { keys } from 'rambdax'
import * as generated from './generated.ts'
import { type LikeC4ViewId } from './generated.ts'

const $views = map(generated.LikeC4Views)

export const useLikeC4View = (viewId: LikeC4ViewId) => {
  return useStore($views, { keys: [viewId] })[viewId]
}

export const LikeC4ViewIds = keys(generated.LikeC4Views)

export type { LikeC4ViewId } from './generated'

if (import.meta.hot) {
  import.meta.hot.accept('./generated.ts', next => {
    console.log('Accepting the updated generated module!')
    console.dir(next)
    if (next && next['LikeC4Views']) {
      $views.set(next['LikeC4Views'])
      // Object.assign(LikeC4Views, next['LikeC4Views'])
      LikeC4ViewIds.length = 0
      LikeC4ViewIds.push(...(keys(next['LikeC4Views']) as any))
    }
  })
}
