import JSON5 from 'json5'
import { joinURL } from 'ufo'
import { LikeC4Model } from '../../model'
import { type ProjectVirtualModule, type VirtualModule, generateMatches, k } from './_shared'

const projectModelCode = (model: LikeC4Model.Layouted) => `
import { nano, createHooksForModel } from 'likec4/react'

export const $likec4data = nano.atom(${JSON5.stringify(model.$data)})

export const {
  updateModel,
  $likec4model,
  useLikeC4Model,
  useLikeC4Views,
  useLikeC4View
}= /* @__PURE__ */ createHooksForModel($likec4data)

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    if (!import.meta.hot.data.$update) {
      import.meta.hot.data.$update = updateModel
    }
    const update = md.$likec4data?.value
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
  async load({ likec4, projectId, logger, assetsDir }) {
    logger.info(k.dim(`generating likec4:model/${projectId}`))
    const model = await likec4.layoutedModel(projectId)
    return projectModelCode(model)
  },
} satisfies ProjectVirtualModule

export const modelModule = {
  id: 'likec4:model',
  virtualId: 'likec4:plugin/model.js',
  async load({ likec4, logger, projects, assetsDir }) {
    logger.info(k.dim('generating likec4:model'))
    const cases = projects.map(({ id }) => {
      const pkg = joinURL('likec4:model', id)
      return ` case ${JSON.stringify(id)}: return await import(${JSON.stringify(pkg)})`
    })
    return `
    export async function loadModel(projectId) {
      switch (projectId) {
        ${cases.join('\n')}
        default: throw new Error('Unknown projectId: ' + projectId)
      }
    }
    `
  },
} satisfies VirtualModule
