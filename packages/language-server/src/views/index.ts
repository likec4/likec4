import type { LikeC4ManualLayouts, LikeC4ManualLayoutsModuleContext } from './LikeC4ManualLayouts'

export { DefaultLikeC4Views, type LikeC4Views } from './LikeC4Views'

export type { LikeC4ManualLayouts, LikeC4ManualLayoutsModuleContext }

export const NoopLikeC4ManualLayouts: LikeC4ManualLayoutsModuleContext = {
  manualLayouts: (): LikeC4ManualLayouts => {
    return {
      read: () => Promise.resolve(null),
      write: () =>
        Promise.reject(
          new Error('NoopLikeC4ManualLayouts: write operation is not supported'),
        ),
      remove: () => Promise.resolve(null),
      clearCaches: () => {},
    }
  },
}
