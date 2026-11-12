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

type BundledIconGroup = 'aws' | 'azure' | 'gcp' | 'md' | 'tech' | 'bootstrap'

type BundledIconRef = {
  group: BundledIconGroup
  icon: string
}

type GeneratedIconRendererParts = {
  imports: string[]
  cases: string[]
}

const bundledIconGroups: ReadonlySet<string> = new Set(['aws', 'azure', 'gcp', 'md', 'tech', 'bootstrap'])

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
  virtualId: 'likec4:plugin/icons.js',
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
    const cases = safeProjects.map(p => {
      const idLiteral = hardenJsonStringLiteralForEmbeddedScript(
        embedProjectIdAsJsString(p.id),
      )
      const pkgLiteral = hardenJsonStringLiteralForEmbeddedScript(
        embedUrlAsJsString(joinURL('likec4:icons', p.id)),
      )
      return `  ${idLiteral}: () => import(${pkgLiteral})`
    })

    const code = `
import { lazy, Suspense } from 'react'
import { jsx } from 'react/jsx-runtime'

export let ProjectIconsRegistry = {
${cases.join(',\n')}
}

// Lazy icon renderers by requested project id, cleared on HMR updates
const lazyRegistry = new Map()

let invalidateMe = false

function resolveLoader(projectId) {
  if (Object.hasOwn(ProjectIconsRegistry, projectId)) {
    return ProjectIconsRegistry[projectId]
  }
  const projects = Object.keys(ProjectIconsRegistry)
  console.error('Unknown projectId: ' + projectId + ' (available: ' + projects + ')')
  if (projects.length === 0) {
    throw new Error('No projects found, invalid state')
  }
  invalidateMe = true
  console.warn('Falling back to project: ' + projects[0])
  return ProjectIconsRegistry[projects[0]]
}

function getLazyRenderer(projectId) {
  let Renderer = lazyRegistry.get(projectId)
  if (!Renderer) {
    const loader = resolveLoader(projectId)
    Renderer = lazy(async () => {
      const { IconRenderer } = await loader()
      return { default: IconRenderer }
    })
    lazyRegistry.set(projectId, Renderer)
  }
  return Renderer
}

export function getProjectIcons(projectId) {
  // Renderer is resolved on each render, so that HMR updates are picked up
  return (props) => jsx(Suspense, { children: jsx(getLazyRenderer(projectId), props) })
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    if (!import.meta.hot.data.$update) {
      import.meta.hot.data.$update = (updateData) => {
        Object.assign(ProjectIconsRegistry, updateData)
        lazyRegistry.clear()
        const shouldInvalidate = invalidateMe
        invalidateMe = false
        return shouldInvalidate
      }
    }
    const update = md.ProjectIconsRegistry
    const shouldInvalidate = update ? import.meta.hot.data.$update(update) : true
    if (shouldInvalidate) {
      import.meta.hot.invalidate()
    }
  })
}
`
    return {
      code,
      moduleType: 'js',
    }
  },
} satisfies VirtualModule
