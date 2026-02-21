import type { ComputedView } from '@likec4/core/types'
import { compareNatural } from '@likec4/core/utils'
import { filter, isTruthy, pipe, sort, unique } from 'remeda'
import k from 'tinyrainbow'
import { joinURL } from 'ufo'
import { type ProjectVirtualModule, type VirtualModule, generateMatches } from './_shared'

function code(views: ComputedView[]) {
  const icons = pipe(
    views.flatMap(v => v.nodes.map(n => n.icon as string | undefined)),
    filter((s): s is string =>
      isTruthy(s) &&
      !(s.toLowerCase().startsWith('http:') || s.toLowerCase().startsWith('https:'))
    ),
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

    acc.imports.push(`import ${Component} from '@likec4/icons/${group}/${icon}'`)
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
  async load({ likec4, project, logger }) {
    logger.info(k.dim(`generating likec4:icons/${project.id}`))
    const views = await likec4.views.computedViews(project.id)
    return code(views)
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
    logger.info(k.dim(`generating likec4:icons`))

    const safeProjects = projects.filter(p => {
      if (!SAFE_PROJECT_ID_REGEX.test(p.id)) {
        logger.warn(k.yellow(`Skipping project with unsafe id for icons registry: ${p.id}`))
        return false
      }
      return true
    })

    const registry = safeProjects
      .map(p => {
        const idLiteral = embedProjectIdAsJsString(p.id)
        const pkgLiteral = embedUrlAsJsString(joinURL('likec4:icons', p.id))
        return { idLiteral, pkgLiteral }
      })
      .map(({ idLiteral, pkgLiteral }) =>
        `${idLiteral}: lazy(() => import(${pkgLiteral}).then(m => ({default: m.IconRenderer})))`
      )
      .join(',\n')

    return `
import { jsx } from 'react/jsx-runtime'
import { lazy, Suspense } from 'react' 
export let ProjectIconsRegistry = {
${registry}
}      


export function getProjectIcons(projectId) {
  let fn = ProjectIconsRegistry[projectId]
  if (!fn) {
    const projects = Object.keys(ProjectIconsRegistry)
    console.error('Unknown projectId: ' + projectId + ' (available: ' + projects + ')')
    if (projects.length === 0) {
      throw new Error('No projects found, invalid state')
    }
    projectId = projects[0]
    console.warn('Falling back to project: ' + projectId)
    fn = ProjectIconsRegistry[projectId]
  }
  return (props) => jsx(Suspense, { children: jsx(fn, props) })
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    if (!import.meta.hot.data.$update) {
      import.meta.hot.data.$update = ProjectIconsRegistry
    }
    const update = md.ProjectIconsRegistry
    if (update) {
      Object.assign(import.meta.hot.data.$update, update)
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`
  },
} satisfies VirtualModule
