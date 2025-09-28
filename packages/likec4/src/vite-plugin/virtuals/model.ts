import JSON5 from 'json5'
import { LikeC4Model } from '../../model'
import { type ProjectVirtualModule, generateCombinedProjects, generateMatches, k } from './_shared'

const projectModelCode = (model: LikeC4Model.Layouted) => `
import { createHooksForModel, atom } from 'likec4/vite-plugin/internal'

export const $likec4data = atom(${JSON5.stringify(model.$data)})

export const {
  updateModel,
  $likec4model,
  useLikeC4Model,
  useLikeC4Views,
  useLikeC4View
} = createHooksForModel($likec4data)

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    if (!import.meta.hot.data.$update) {
      import.meta.hot.data.$update = updateModel
    }
    const update = md.$likec4data?.get()
    if (update) {
      import.meta.hot.data.$update(update)
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`

export const projectModelModule = {
  ...generateMatches('model'),
  async load({ likec4, project, logger }) {
    logger.info(k.dim(`generating likec4:model/${project.id}`))
    const model = await likec4.layoutedModel(project.id)
    return projectModelCode(model)
  },
} satisfies ProjectVirtualModule

export const modelModule = generateCombinedProjects('model', 'loadModel')
