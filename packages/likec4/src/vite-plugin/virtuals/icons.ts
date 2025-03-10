import { filter, isString, isTruthy, pipe, unique } from 'remeda'
import k from 'tinyrainbow'
import { joinURL } from 'ufo'
import type { ComputedView } from '../../model'
import { type ProjectVirtualModule, type VirtualModule, generateMatches } from './_shared'

function code(views: ComputedView[]) {
  const icons = pipe(
    views.flatMap(v => v.nodes.map(n => n.icon)),
    filter(isString),
    filter(s => isTruthy(s) && !s.toLowerCase().startsWith('http')),
    unique(),
  ).sort()

  const {
    imports,
    cases,
  } = icons.reduce((acc, s, i) => {
    const [group, icon] = s.split(':') as ['aws' | 'azure' | 'gcp' | 'tech', string]

    const Component = 'Icon' + i.toString().padStart(2, '0')

    acc.imports.push(`import ${Component} from 'likec4/icons/${group}/${icon}'`)
    acc.cases.push(`  '${group}:${icon}': ${Component}`)
    return acc
  }, {
    imports: [] as string[],
    cases: [] as string[],
  })
  return `
import { jsxs, jsx } from 'react/jsx-runtime'
${imports.join('\n')}

export const Icons = {
${cases.join(',\n')}
}
export function IconRenderer({ node }) {
  const IconComponent = Icons[node.icon ?? '']
  if (!IconComponent) {
    return null
  }
  return jsx(IconComponent, {node})
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    const update = md.Icons
    if (update) {
      if (!import.meta.hot.data.icons) {
        import.meta.hot.data.icons = Icons
      }
      Object.assign(import.meta.hot.data.icons, update)
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`
}

export const projectIconsModule = {
  ...generateMatches('icons'),
  virtualId: (projectId) => joinURL(`\0likec4-plugin`, projectId, 'icons.jsx'),
  async load({ likec4, projectId, logger }) {
    logger.info(k.dim(`generating virtual:likec4/icons/${projectId}`))
    const views = await likec4.views.computedViews(projectId)
    return code(views)
  },
} satisfies ProjectVirtualModule

export const iconsModule = {
  id: 'virtual:likec4/icons',
  virtualId: '\0likec4-plugin/icons.js',
  async load({ likec4, projects, logger }) {
    logger.info(k.dim(`generating virtual:likec4/icons`))

    const {
      imports,
      cases,
    } = projects.reduce((acc, { id }, i) => {
      const Component = 'Icons' + i.toString().padStart(2, '0')
      const pkg = joinURL('virtual:likec4', id, 'icons')
      acc.imports.push(`import { IconRenderer as ${Component} } from ${JSON.stringify(pkg)}`)
      acc.cases.push(`   case ${JSON.stringify(id)}: return ${Component}`)
      return acc
    }, {
      imports: [] as string[],
      cases: [] as string[],
    })

    return `
${imports.join('\n')}

export function ProjectIcons(projectId) {
  switch (projectId) {
${cases.join('\n')}
    default:
      throw new Error('Unknown projectId: ' + projectId)
  }
}
`
  },
} satisfies VirtualModule
