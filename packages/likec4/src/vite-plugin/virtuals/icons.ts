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

export const iconsModule = {
  id: 'likec4:icons',
  virtualId: 'likec4:plugin/icons.jsx',
  async load({ projects, logger }) {
    logger.info(k.dim(`generating likec4:icons`))

    const {
      imports,
      cases,
    } = projects.reduce((acc, { id }, i) => {
      const Component = 'Icons' + i.toString().padStart(2, '0')
      const pkg = JSON.stringify(joinURL('likec4:icons', id))
      // acc.imports.push(`import { IconRenderer as ${Component} } from ${JSON.stringify(pkg)}`)
      acc.cases.push(
        `${JSON.stringify(id)}: lazy(() => import(${pkg}).then(m => ({default: m.IconRenderer})))`,
      )
      return acc
    }, {
      imports: [] as string[],
      cases: [] as string[],
    })

    return `
import { lazy } from 'react' 
export let ProjectIconsFn = {
${cases.join(',\n')}
}      


export function getProjectIcons(projectId) {
  let fn = ProjectIconsFn[projectId]
  if (!fn) {
    const projects = Object.keys(ProjectIconsFn)
    console.error('Unknown projectId: ' + projectId + ' (available: ' + projects + ')')
    if (projects.length === 0) {
      throw new Error('No projects found, invalid state')
    }
    projectId = projects[0]
    console.warn('Falling back to project: ' + projectId)
    fn = ProjectIconsFn[projectId]
  }
  return fn
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    if (!import.meta.hot.data.$update) {
      import.meta.hot.data.$update = ProjectIconsFn
    }
    const update = md.ProjectIconsFn
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

// return {
//   id: `likec4:${moduleId}`,
//   virtualId: `likec4:plugin/${moduleId}.js`,
//   async load({ logger, projects }) {
//     logger.info(k.dim(`generating likec4:${moduleId}`))
//     const cases = projects.map(({ id }) => {
//       const pkg = escapeUnsafeChars(
//         JSON.stringify(
//           joinURL(`likec4:${moduleId}`, id),
//         ),
//       )
//       return `  ${JSON.stringify(id)}: () => import(${pkg})`
//       // return `  ${JSON.stringify(id)}: () => ${pkg}`
//     })
//     return `
// export let ${fnName}Fn = {
// ${cases.join(',\n')}
// }

// export async function ${fnName}(projectId) {
//   let fn = ${fnName}Fn[projectId]
//   if (!fn) {
//     const projects = Object.keys(${fnName}Fn)
//     console.error('Unknown projectId: ' + projectId + ' (available: ' + projects + ')')
//     if (projects.length === 0) {
//       throw new Error('No projects found, invalid state')
//     }
//     projectId = projects[0]
//     console.warn('Falling back to project: ' + projectId)
//     fn = ${fnName}Fn[projectId]
//   }
//   return await fn()
// }

// if (import.meta.hot) {
//   import.meta.hot.accept(md => {
//     if (!import.meta.hot.data.$update) {
//       import.meta.hot.data.$update = ${fnName}Fn
//     }
//     const update = md.${fnName}Fn
//     if (update) {
//       Object.assign(import.meta.hot.data.$update, update)
//     } else {
//       import.meta.hot.invalidate()
//     }
//   })
// }
//     `
//   },
// }
