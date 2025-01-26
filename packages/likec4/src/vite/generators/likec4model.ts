import JSON5 from 'json5'
import { LikeC4Model } from '../../model'

export function likec4ModelSources(model: LikeC4Model.Layouted) {
  const {
    views,
    ...rest
  } = model.$model
  return `
import { createLikeC4Model } from 'likec4/model'
import { nano } from 'likec4/react'

// This is needed for better tree shaking
export const LikeC4Views = ${JSON5.stringify(views)}

export const likeC4Model = /* @__PURE__ */ createLikeC4Model(Object.assign(
  ${JSON5.stringify(rest)},
  {views: LikeC4Views}
))

export const $likec4model = /* @__PURE__ */ nano.atom(likeC4Model)

export function useLikeC4Model() {
  return /* @__PURE__ */ nano.useStore($likec4model)
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
