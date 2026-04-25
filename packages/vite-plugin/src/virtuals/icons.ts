import { compareNatural } from '@likec4/core/utils'
import { filter, flatMap, isTruthy, map, pipe, sort, unique, values } from 'remeda'
import k from 'tinyrainbow'
import { joinURL } from 'ufo'
import { logGenerating } from '../logger'
import { type ProjectVirtualModule, type VirtualModule, generateMatches } from './_shared'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'

const startsWithHttp = /^(https?:)?\/\//i

function code<V extends { nodes: ReadonlyArray<{ icon?: string | null }> }>(views: V[]) {
  const icons = pipe(
    views,
    flatMap(v => v.nodes),
    map(n => n.icon ?? undefined),
    filter((s): s is string => isTruthy(s) && !startsWithHttp.test(s)),
    unique(),
    sort(compareNatural),
  )

  const {
    imports,
    cases,
  } = icons.reduce((acc, s, i) => {
    const isLocalImage = s.startsWith('file:')
    const Component = 'Icon' + i.toString().padStart(2, '0')

    if (isLocalImage) {
      acc.imports.push(`import ${Component} from '${s}?inline'`)
      acc.cases.push(`  '${s}': () => jsx('img', { src: ${Component} })`)

      return acc
    }

    const [group, icon] = s.split(':') as ['aws' | 'azure' | 'gcp' | 'tech', string]
    const url = `likec4:icon-bundle/${group}/${icon}.jsx`
    acc.imports.push(`import ${Component} from '${url}'`)
    acc.cases.push(`  '${group}:${icon}': ${Component}`)
    return acc
  }, {
    imports: [] as string[],
    cases: [] as string[],
  })
  return `
import { jsx } from 'react/jsx-runtime'
${imports.join('\n')}

const Icons = {
${cases.join(',\n')}
}
export function IconRenderer({ node, ...props }) {
  const IconComponent = Icons[node.icon ?? '']
  if (!IconComponent) {
    return null
  }
  return jsx(IconComponent, props)
}
`
}

export const projectIconsModule = {
  ...generateMatches('icons', '.jsx'),
  async load({ likec4, project }) {
    logGenerating('icons', project.id)
    const model = await likec4.computedModel(project.id)
    const views = [
      ...values(model.$data.views),
      ...values(model.$data.manualLayouts ?? {}),
    ]
    return {
      moduleSideEffects: false,
      moduleType: 'jsx',
      code: code(views),
    }
  },
} satisfies ProjectVirtualModule

/** Safe chars for project id when embedded in generated code (CodeQL: proper sanitization). */
const SAFE_PROJECT_ID_REGEX = /^[a-zA-Z0-9_.-]+$/

/** Embed project id as JS string literal; allowlist only (CodeQL: code sanitization). */
function embedProjectIdAsJsString(projectId: string): string {
  if (!SAFE_PROJECT_ID_REGEX.test(projectId)) {
    throw new Error(`Unsafe value for code generation: ${projectId}`)
  }
  return JSON.stringify(projectId)
}

/** Embed URL as JS string literal; URL is built from allowlisted project id so only escape needed. */
function embedUrlAsJsString(url: string): string {
  return JSON.stringify(url)
}

export const iconsModule = {
  id: 'likec4:icons',
  virtualId: 'likec4:plugin/icons.jsx',
  async load({ projects, logger }) {
    logGenerating('icons')

    const safeProjects = projects.filter(p => {
      if (!SAFE_PROJECT_ID_REGEX.test(p.id)) {
        logger.warn(k.yellow(`Skipping project with unsafe id for icons registry: ${p.id}`))
        return false
      }
      return true
    })

    // codeql[js/bad-code-sanitization]: Generated import() specifiers are JSON string literals from joinURL('likec4:icons', id) after JSON.stringify + hardenJsonStringLiteralForEmbeddedScript; ids pass SAFE_PROJECT_ID_REGEX (no breakout in emitted JS).
    const registry = safeProjects
      .map(p => {
        const idLiteral = hardenJsonStringLiteralForEmbeddedScript(
          embedProjectIdAsJsString(p.id),
        )
        const pkgLiteral = hardenJsonStringLiteralForEmbeddedScript(
          embedUrlAsJsString(joinURL('likec4:icons', p.id)),
        )
        return { idLiteral, pkgLiteral }
      })
      .map(({ idLiteral, pkgLiteral }) =>
        `${idLiteral}: lazy(async () => await import(${pkgLiteral}).then(m => ({ default: m.IconRenderer })))`
      )
      .join(',\n')

    const code = `
import { jsx } from 'react/jsx-runtime'
import { lazy, Suspense } from 'react' 
export let ProjectIconsRegistry = {
${registry}
}      


export function getProjectIcons(projectId) {
  return (props) => {
    let Renderer = ProjectIconsRegistry[projectId]
    if (!Renderer) {
      const projects = Object.keys(ProjectIconsRegistry)
      console.error('Unknown projectId: ' + projectId + ' (available: ' + projects + ')')
      if (projects.length === 0) {
        throw new Error('No projects found, invalid state')
      }
      projectId = projects[0]
      console.warn('Falling back to project: ' + projectId)
      Renderer = ProjectIconsRegistry[projectId]
    }
    return jsx(Suspense, { children: jsx(Renderer, props) })
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    if (!import.meta.hot.data.$update) {
      import.meta.hot.data.$update = ProjectIconsRegistry
    }
    const update = md.ProjectIconsRegistry
    if (update) {
      for (const [id, renderer] of Object.entries(update)) {
        import.meta.hot.data.$update[id] ??= renderer
      }
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`
    return {
      code,
      moduleType: 'jsx',
      moduleSideEffects: false,
    }
  },
} satisfies VirtualModule
