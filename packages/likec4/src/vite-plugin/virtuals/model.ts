import JSON5 from 'json5'
import { joinURL } from 'ufo'
import { LikeC4Model } from '../../model'
import { type ProjectVirtualModule, type VirtualModule, generateMatches, k } from './_shared'

const projectModelCode = (model: LikeC4Model.Layouted) => `
import { createLikeC4Model } from 'likec4/model'
import { nano, deepEqual } from 'likec4/react'

export const $likec4data = nano.atom(${JSON5.stringify(model.$model)})

export const $likec4model = /* @__PURE__ */ nano.computed($likec4data, (data) => /* @__PURE__ */ createLikeC4Model(data))

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    if (!import.meta.hot.data.$current) {
      import.meta.hot.data.$current = $likec4data
    }
    const update = md.$likec4data?.value
    if (update) {
      const current = import.meta.hot.data.$current.get()
      if (!deepEqual(current, update)) {
        import.meta.hot.data.$current.set(update)
      }
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`

export const projectModelModule = {
  ...generateMatches('model'),
  async load({ likec4, projectId, logger, assetsDir }) {
    logger.info(k.dim(`generating virtual:likec4/model/${projectId}`))
    const model = await likec4.layoutedModel(projectId)
    return projectModelCode(model)
  },
} satisfies ProjectVirtualModule

export const modelModule = {
  id: 'virtual:likec4/model',
  virtualId: '\0likec4-plugin/model.js',
  async load({ likec4, logger, projects, assetsDir }) {
    logger.info(k.dim('generating virtual:likec4/model'))
    const cases = projects.map(({ id }) => {
      const pkg = joinURL('virtual:likec4', id, 'model')
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
