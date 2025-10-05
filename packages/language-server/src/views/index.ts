import type { LikeC4ManualLayoutsModuleContext } from './LikeC4ManualLayouts'

export type { LikeC4ManualLayouts } from './LikeC4ManualLayouts'
export { DefaultLikeC4Views, type LikeC4Views } from './LikeC4Views'

export const NoopLikeC4ManualLayouts: LikeC4ManualLayoutsModuleContext = {
  manualLayouts: () => {
    return {
      read: () => Promise.resolve().then(() => ({})),
      write: () => Promise.resolve().then(() => undefined),
    }
  },
}
