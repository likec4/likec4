// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { compareNatural } from '@likec4/core/utils'
import { filter, isTruthy, map, pipe, sort, unique, values } from 'remeda'
import k from 'tinyrainbow'
import { joinURL } from 'ufo'
import { logGenerating } from '../logger'
import { type ProjectVirtualModule, type VirtualModule, generateMatches } from './_shared'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'

const startsWithHttp = /^(https?:)?\/\//i

type IconRef = {
  icon?: string | null
}

type ViewWithIcons = {
  nodes: ReadonlyArray<IconRef>
}

type ModelDataWithIcons = {
  views: Record<string, ViewWithIcons>
  manualLayouts?: Record<string, ViewWithIcons>
  elements: Record<string, { style?: IconRef }>
  deployments: {
    elements: Record<string, { style?: IconRef }>
  }
}

type BundledIconGroup = 'aws' | 'azure' | 'gcp' | 'tech' | 'bootstrap'

type BundledIconRef = {
  group: BundledIconGroup
  icon: string
}

type GeneratedIconRendererParts = {
  imports: string[]
  cases: string[]
}

const bundledIconGroups: ReadonlySet<string> = new Set(['aws', 'azure', 'gcp', 'tech', 'bootstrap'])

function iconRef(icon: string | null | undefined): string | undefined {
  if (!isTruthy(icon) || startsWithHttp.test(icon) || icon === 'none' || icon.startsWith('data:image')) {
    return undefined
  }
  return icon.startsWith('file:') || parseBundledIconRef(icon) ? icon : undefined
}

function iconRefsFromModelData(data: ModelDataWithIcons): string[] {
  const iconsFromViews = (views: Record<string, ViewWithIcons>): Array<string | null | undefined> =>
    values(views).flatMap(view => view.nodes.map(node => node.icon))
  const iconsFromStyled = (items: Record<string, { style?: IconRef }>): Array<string | null | undefined> =>
    values(items).map(item => item.style?.icon)

  return pipe(
    [
      ...iconsFromViews(data.views),
      ...iconsFromViews(data.manualLayouts ?? {}),
      ...iconsFromStyled(data.elements),
      ...iconsFromStyled(data.deployments.elements),
    ],
    map(iconRef),
    filter(isTruthy),
    unique(),
    sort(compareNatural),
  )
}

const isLocalSvg = (icon: string): boolean => {
  if (!icon.startsWith('file:')) {
    return false
  }
  return icon.toLowerCase().split(/[?#]/)[0]?.endsWith('.svg') ?? false
}

const jsStringLiteral = (value: string): string => hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(value))

function isBundledIconGroup(group: string): group is BundledIconGroup {
  return bundledIconGroups.has(group)
}

function parseBundledIconRef(iconRef: string): BundledIconRef | null {
  const separator = iconRef.indexOf(':')
  if (separator <= 0 || separator === iconRef.length - 1) {
    return null
  }

  const group = iconRef.slice(0, separator)
  if (!isBundledIconGroup(group)) {
    return null
  }

  return {
    group,
    icon: iconRef.slice(separator + 1),
  }
}

export function generateIconRendererCode(data: ModelDataWithIcons): string {
  const icons = iconRefsFromModelData(data)

  const {
    imports,
    cases,
  } = icons.reduce<GeneratedIconRendererParts>((acc, s, i) => {
    const isLocalImage = s.startsWith('file:')
    const Component = 'Icon' + i.toString().padStart(2, '0')
    const iconLiteral = jsStringLiteral(s)

    if (isLocalImage) {
      if (isLocalSvg(s)) {
        const RawComponent = `${Component}Raw`
        acc.imports.push(`import ${RawComponent} from ${jsStringLiteral(`${s}?raw`)}`)
        acc.imports.push(`import ${Component} from ${jsStringLiteral(`${s}?inline`)}`)
        acc.cases.push(
          `  ${iconLiteral}: props => jsx(LocalSvgIcon, { ...props, src: ${Component}, raw: ${RawComponent} })`,
        )
      } else {
        acc.imports.push(`import ${Component} from ${jsStringLiteral(`${s}?inline`)}`)
        acc.cases.push(`  ${iconLiteral}: props => jsx('img', { ...props, src: ${Component} })`)
      }

      return acc
    }

    const bundledIcon = parseBundledIconRef(s)
    if (!bundledIcon) {
      return acc
    }
    const { group, icon } = bundledIcon
    const url = `likec4:icon-bundle/${group}/${icon}.jsx`
    acc.imports.push(`import ${Component} from ${jsStringLiteral(url)}`)
    acc.cases.push(`  ${iconLiteral}: ${Component}`)
    return acc
  }, {
    imports: [],
    cases: [],
  })
  return `
import { jsx } from 'react/jsx-runtime'
${imports.join('\n')}

const Icons = {
${cases.join(',\n')}
}

function MaskedSvgIcon({ src, style, ...props }) {
  const maskUrl = 'url(' + JSON.stringify(src) + ')'
  return jsx('span', {
    ...props,
    style: {
      ...style,
      display: 'inline-block',
      width: '100%',
      height: '100%',
      backgroundColor: 'currentColor',
      maskImage: maskUrl,
      maskRepeat: 'no-repeat',
      maskPosition: 'center',
      maskSize: 'contain',
      WebkitMaskImage: maskUrl,
      WebkitMaskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      WebkitMaskSize: 'contain'
    }
  })
}

function LocalSvgIcon({ src, raw, ...props }) {
  if (typeof raw === 'string' && /currentcolor/i.test(raw)) {
    return jsx(MaskedSvgIcon, { ...props, src })
  }
  return jsx('img', { ...props, src })
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

export const projectIconsModule: ProjectVirtualModule = {
  ...generateMatches('icons', '.jsx'),
  async load({ likec4, project }) {
    logGenerating('icons', project.id)
    const model = await likec4.computedModel(project.id)
    return {
      moduleType: 'jsx',
      code: generateIconRendererCode(model.$data),
    }
  },
}

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
    const { imports, cases } = safeProjects
      .reduce((acc, p, i) => {
        const ProjectComponent = 'Project' + i.toString().padStart(2, '0')
        const idLiteral = hardenJsonStringLiteralForEmbeddedScript(
          embedProjectIdAsJsString(p.id),
        )
        const pkgLiteral = hardenJsonStringLiteralForEmbeddedScript(
          embedUrlAsJsString(joinURL('likec4:icons', p.id)),
        )
        acc.imports.push(`import {IconRenderer as ${ProjectComponent}} from ${pkgLiteral}`)
        acc.cases.push(`  ${idLiteral}: ${ProjectComponent}`)
        return acc
      }, {
        imports: [] as string[],
        cases: [] as string[],
      })

    const code = `
import { jsx } from 'react/jsx-runtime'
${imports.join('\n')}

export let ProjectIconsRegistry = {
${cases.join(',\n')}
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
    return jsx(Renderer, props)
  }
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
    return {
      code,
      moduleType: 'jsx',
    }
  },
} satisfies VirtualModule
