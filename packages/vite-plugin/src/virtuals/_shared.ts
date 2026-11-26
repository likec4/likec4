// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { LikeC4ProjectConfig, WebappExportFormat } from '@likec4/config'
import type { LikeC4Project, NonEmptyArray, ProjectId } from '@likec4/core'
import type { LikeC4LanguageServices } from '@likec4/language-services'
import type { URI } from 'langium'
import type { Rolldown } from 'vite'
import type { AIOptions } from '../plugin'
import k from 'tinyrainbow'
import { joinURL } from 'ufo'
import { type ViteLogger, logGenerating } from '../logger'
import { isWebappExportFormatEnabled } from './export-formats'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'

export { k }

export type ProjectData = LikeC4Project & {
  readonly folder: URI
  readonly path: string
  readonly config: Readonly<LikeC4ProjectConfig>
}
export type ProjectsData = NonEmptyArray<ProjectData>

export type VirtualModuleLoadResult = Rolldown.SourceDescription | string

export type SharedVirtualModuleOptions =
  & {
    rpcEnabled: boolean
    logger: ViteLogger
    likec4: LikeC4LanguageServices
    assetsDir: string
    /**
     * Absolute path to the file with UI customizations, if configured
     */
    customizationFile: string | undefined
  }
  & (
    {
      isAIAvailable: false
      ai: undefined
    } | {
      isAIAvailable: true
      ai: AIOptions
    }
  )

/**
 * Prefix of public module ids, e.g. `likec4:model` or `likec4:model/<projectId>`
 */
const ID_PREFIX = 'likec4:'
/**
 * Prefix of resolved ids, following the Vite convention for virtual modules
 * @see https://vite.dev/guide/api-plugin#virtual-modules-convention
 */
const VIRTUAL_ID_PREFIX = '\0' + ID_PREFIX
const VIRTUAL_ID_SUFFIX = '.js'

export interface ParsedModuleId {
  /**
   * Module name, e.g. `model` in `likec4:model/<projectId>`
   */
  name: string
  /**
   * Project id for project scoped modules, `null` for global modules
   */
  projectId: ProjectId | null
}

/**
 * Resolved id of the virtual module, e.g. `\0likec4:model/<projectId>.js`
 */
export function toVirtualId(name: string, projectId?: ProjectId | null): string {
  return VIRTUAL_ID_PREFIX + (projectId ? `${name}/${projectId}` : name) + VIRTUAL_ID_SUFFIX
}

/**
 * Parses public (`likec4:<name>[/<projectId>]`) or resolved (`\0likec4:<name>[/<projectId>].js`) module id.
 * Returns `null` if the id does not belong to LikeC4 virtual modules.
 */
export function parseModuleId(id: string): ParsedModuleId | null {
  let rest: string
  switch (true) {
    case id.startsWith(VIRTUAL_ID_PREFIX) && id.endsWith(VIRTUAL_ID_SUFFIX): {
      rest = id.slice(VIRTUAL_ID_PREFIX.length, -VIRTUAL_ID_SUFFIX.length)
      break
    }
    case id.startsWith(ID_PREFIX): {
      rest = id.slice(ID_PREFIX.length)
      break
    }
    default:
      return null
  }
  const separator = rest.indexOf('/')
  if (separator === -1) {
    return rest ? { name: rest, projectId: null } : null
  }
  const name = rest.slice(0, separator)
  const projectId = rest.slice(separator + 1)
  if (!name || !projectId) {
    return null
  }
  return { name, projectId: projectId as ProjectId }
}

/**
 * Global virtual module, imported as `likec4:<name>`
 */
export interface VirtualModule {
  name: string
  /**
   * Reload the module when projects change
   */
  hmr?: boolean
  load(
    opts: SharedVirtualModuleOptions & {
      projects: NonEmptyArray<ProjectData>
    },
  ): Promise<VirtualModuleLoadResult>
}

/**
 * Project scoped virtual module, imported as `likec4:<name>/<projectId>`
 */
export interface ProjectVirtualModule {
  name: string
  /**
   * Reload the module when the project model changes
   */
  hmr?: boolean
  exportFormat?: WebappExportFormat
  load(
    opts: SharedVirtualModuleOptions & {
      project: ProjectData
    },
  ): Promise<VirtualModuleLoadResult>
}

/**
 * Indexes modules by name, throws on duplicates
 */
export function indexByName<M extends { name: string }>(modules: ReadonlyArray<M>): ReadonlyMap<string, M> {
  const index = new Map<string, M>()
  for (const module of modules) {
    if (index.has(module.name)) {
      throw new Error(`Duplicate LikeC4 virtual module: ${module.name}`)
    }
    index.set(module.name, module)
  }
  return index
}

export function generateCombinedProjects(
  moduleId: string,
  fnName: string,
  exportFormat?: WebappExportFormat,
): VirtualModule {
  return {
    name: moduleId,
    hmr: true,
    async load({ projects }) {
      logGenerating(moduleId)

      const enabledProjects = exportFormat
        ? projects.filter(({ config }) => isWebappExportFormatEnabled(config, exportFormat))
        : projects

      const cases = enabledProjects.map(({ id }) => {
        const idLiteral = hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(id))
        const pkgLiteral = hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(joinURL(`likec4:${moduleId}`, id)))
        return `${idLiteral}: () => import(${pkgLiteral})`
      })
      const disabledExportMessageLiteral = exportFormat
        ? hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(`Project does not enable ${exportFormat} export: `))
        : null

      const registryName = fnName + 'Registry'

      const code = `
export let ${registryName} = {
${cases.join(',\n')}
}      

const cachedPromises = new Map()
export function ${fnName}(projectId) {
  if (cachedPromises.has(projectId)) {
    return cachedPromises.get(projectId)
  }
  let fn = ${registryName}[projectId]
  if (!fn) {
    const projects = Object.keys(${registryName})
    console.error('Unknown projectId: ' + projectId + ' (available: ' + projects + ')')
    ${
      exportFormat
        ? `return Promise.reject(new Error(${disabledExportMessageLiteral} + projectId))`
        : `
    if (projects.length === 0) {
      return Promise.reject(new Error('No projects found, invalid state'))
    }
    projectId = projects[0]
    console.warn('Falling back to project: ' + projectId)
    return ${fnName}(projectId)
    `
    }
  }
  const promise = fn()
  cachedPromises.set(projectId, promise)
  return promise
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    if (!import.meta.hot.data.$update) {
      import.meta.hot.data.$update = (update) => {
        for (const [key, value] of Object.entries(update)) {
          if (cachedPromises.has(key)) {
            // Remove from cache to force reload
            cachedPromises.delete(key)
          }
          ${registryName}[key] = value
        }
      }
    }
    const update = md.${registryName}
    if (update) {
      import.meta.hot.data.$update(update)
    } else {
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
  }
}
