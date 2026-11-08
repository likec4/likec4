import { LikeC4Model } from '@likec4/core/model'
import JSON5 from 'json5'
import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { resolve } from 'pathe'
import { logGenerating } from '../logger'
import { type ProjectData, type ProjectVirtualModule, generateCombinedProjects, generateMatches } from './_shared'

/**
 * Absolute paths of the files in `styles.customCss`.
 * A file that can't be read is left out, the config loader has already warned about it.
 */
const customCssFiles = async ({ config, folder }: ProjectData): Promise<string[]> => {
  const files = (config.styles?.customCss?.paths ?? []).map(path => resolve(folder.fsPath, path))
  const readable = await Promise.all(files.map(file => access(file, constants.R_OK).then(() => true, () => false)))
  return files.filter((_, i) => readable[i])
}

/**
 * Custom CSS goes through Vite instead of using the content read by the config loader:
 * Vite inlines `@import`, resolves `url()` against the CSS file, and updates the model when a file changes.
 */
const modelDataCode = ($data: LikeC4Model.Layouted['$data'], cssFiles: string[]) => {
  if (cssFiles.length === 0) {
    return { imports: '', data: JSON5.stringify($data) }
  }
  const styles = { ...$data.project.styles, customCss: { content: '' } }
  return {
    imports: cssFiles.map((file, i) => `import customCss${i} from ${JSON.stringify(`${file}?inline`)}`).join('\n'),
    data: `(data => {
  data.project.styles.customCss.content = [${cssFiles.map((_, i) => `customCss${i}`).join(', ')}].join('\\n')
  return data
})(${JSON5.stringify({ ...$data, project: { ...$data.project, styles } })})`,
  }
}

const projectModelCode = (model: LikeC4Model.Layouted, cssFiles: string[]) => {
  const { imports, data } = modelDataCode(model.$data, cssFiles)
  return `
import { createHooksForModel, atom } from 'likec4/vite-plugin/internal'
${imports}

export let $likec4data = atom(${data})

export let {
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
}

export const projectModelModule: ProjectVirtualModule = {
  ...generateMatches('model'),
  async load({ likec4, project }) {
    logGenerating('model', project.id)
    const model = await likec4.layoutedModel(project.id)
    return {
      code: projectModelCode(model, await customCssFiles(project)),
      moduleType: 'js',
    }
  },
}

export const modelModule = generateCombinedProjects('model', 'loadModel')
