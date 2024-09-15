import { LikeC4Model } from '@likec4/core'
import JSON5 from 'json5'

export function likec4ModelSources(model: LikeC4Model.Layouted) {
  const {
    views,
    ...rest
  } = model.sourcemodel
  return `
import { createLikeC4Model, atom, computed, useNanoStore } from 'likec4/react'

export const LikeC4Views = ${JSON5.stringify(views)}

export const likec4sourcemodel = /* @__PURE__ */ Object.assign(
  ${JSON5.stringify(rest)},
  {views: LikeC4Views}
)

export const $likec4sourcemodel = /* @__PURE__ */ atom(likec4sourcemodel)

export const $likec4model = /* @__PURE__ */ computed($likec4sourcemodel, createLikeC4Model)

export function useLikeC4Model() {
  return useNanoStore($likec4model)
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    const update = md.$likec4sourcemodel
    if (update) {
      if (!import.meta.hot.data.$current) {
        import.meta.hot.data.$current = $likec4sourcemodel
      }
      import.meta.hot.data.$current.set(update.get())
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`
}
