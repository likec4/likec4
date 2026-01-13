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

    acc.imports.push(`import ${Component} from 'likec4/icons/${group}/${icon}'`)
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
  
if (import.meta.hot) {
  import.meta.hot.accept()
}
`
}

export const projectIconsModule = {
  ...generateMatches('icons'),
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
      const pkg = joinURL('likec4:icons', id)
      acc.imports.push(`import { IconRenderer as ${Component} } from ${JSON.stringify(pkg)}`)
      acc.cases.push(`   case ${JSON.stringify(id)}: return ${Component}`)
      return acc
    }, {
      imports: [] as string[],
      cases: [] as string[],
    })

    return `
import { jsx } from 'react/jsx-runtime'    
${imports.join('\n')}

function getProjectIcons(projectId) {
  switch (projectId) {
${cases.join('\n')}
    default:
      throw new Error('Unknown projectId: ' + projectId)
  }
}

export function ProjectIcons({ projectId, ...props }) {
  const IconComponent = getProjectIcons(projectId)
  return jsx(IconComponent, props)
}
if (import.meta.hot) {
  import.meta.hot.accept()
}  
`
  },
} satisfies VirtualModule
