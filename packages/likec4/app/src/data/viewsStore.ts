// import type { DiagramView } from '@likec4/core'
// import { useStore } from '@nanostores/react'
// import { deepEqual as equals } from 'fast-equals'
// import { deepMap, map, type MapStore } from 'nanostores'
// import { LikeC4Views } from 'virtual:likec4/views'

// export const $views = map(LikeC4Views)

// export function useLikeC4View(id: string) {
//   const views = useStore($views, {
//     keys: [id],
//   })
//   return views[id] ?? null
// }

// if (import.meta.hot) {

//   import.meta.hot.accept('/@vite-plugin-likec4/likec4-views', md => {
//     const update = md?.LikeC4Views as typeof LikeC4Views | undefined
//     if (update) {
//       for (const [id, view] of Object.entries(update)) {
//         const current = $views.value?.[id]
//         if (!current || !equals(current, view)) {
//           $views.setKey(id, view)
//         }
//       }
//     }
//   })
// }
export {}
