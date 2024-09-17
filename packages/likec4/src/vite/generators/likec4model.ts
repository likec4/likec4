import { LikeC4Model } from '@likec4/core'
import JSON5 from 'json5'

export function likec4ModelSources(model: LikeC4Model.Layouted) {
  const {
    views,
    ...rest
  } = model.sourcemodel
  return `
import { createLikeC4Model, atom, useNanoStore } from 'likec4/react'

// This is needed for tree better tree shaking
export const LikeC4Views = ${JSON5.stringify(views)}

const sourcemodel = /* @__PURE__ */ Object.assign(
  ${JSON5.stringify(rest)},
  {views: LikeC4Views}
)

export const likec4model = /* @__PURE__ */ createLikeC4Model(sourcemodel)

export let $likec4model = /* @__PURE__ */ atom(likec4model)

export function useLikeC4ModelAtom() {
  return useNanoStore($likec4model)
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    const update = md.$likec4model
    if (update) {
      if (!import.meta.hot.data.$current) {
        import.meta.hot.data.$current = $likec4model
      }
      import.meta.hot.data.$current.set(update.get())
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`
}
