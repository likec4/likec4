import { DefaultMap } from '@likec4/core'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { hasAtLeast } from 'remeda'
import type { Plugin } from 'vite'
import { logger } from './logger'
import { k } from './virtuals/_shared'

const PLUGIN_NAME = 'likec4:icon-bundle'

export function iconBundlePlugin(options: {
  workspace?: string | undefined
  environments?: string[] | undefined
}): Plugin {
  const _cwd = cwd()
  const paths = [_cwd]
  if (options.workspace) {
    paths.unshift(options.workspace)
  }
  let require = createRequire(_cwd)

  let cacheDir: string | undefined

  const resolveIcon = async (group: string, icon: string) => {
    try {
      const resolvedPath = require.resolve(`@likec4/icons/${group}/${icon}`, {
        paths: paths,
      })
      logger.trace(k.dim(`resolved local `) + resolvedPath)
      return await readFile(resolvedPath, 'utf-8')
    } catch {
      // ignore
      return undefined
    }
  }
  const readFromCache = async (group: string, icon: string) => {
    if (!cacheDir) {
      return undefined
    }
    try {
      const path = resolve(cacheDir, group, `${icon}.js`)
      if (existsSync(path)) {
        logger.trace(k.dim(`read cached `) + `${group}/${icon}.js`)
        return await readFile(path, 'utf-8')
      }
    } catch {
    }
    return undefined
  }
  const writeToCache = async (group: string, icon: string, content: string) => {
    if (!cacheDir) {
      return
    }
    try {
      const dir = resolve(cacheDir, group)
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true })
      }
      const path = resolve(dir, `${icon}.js`)
      await writeFile(path, content)
      logger.trace(k.dim(`written to cache `) + path)
    } catch (error) {
      logger.error(k.dim(`failed to write to cache `) + `${group}/${icon}.js`, { error })
    }
  }

  const fetchFromRemote = async (group: string, icon: string) => {
    const url = `https://icons.like-c4.dev/${group}/${icon}.js`
    logger.trace(k.dim(`fetching `) + url)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch icon: ${response.status} ${response.statusText}`)
    }
    return await response.text()
  }

  const iconsCache = new DefaultMap(async (key: `${string}:${string}`) => {
    let [group, icon] = key.split(':') as ['aws' | 'azure' | 'gcp' | 'tech', string]
    if (icon.endsWith('.jsx') || icon.endsWith('.js')) {
      icon = icon.slice(0, icon.lastIndexOf('.'))
    }
    logger.debug(k.dim(`resolving `) + k.green(`${group}:${icon}`))
    let iconContent = await readFromCache(group, icon)
    iconContent ??= await resolveIcon(group, icon)
    if (iconContent) {
      return iconContent
    }
    iconContent = await fetchFromRemote(group, icon)
    await writeToCache(group, icon, iconContent)
    return iconContent
  })

  return {
    name: PLUGIN_NAME,

    applyToEnvironment(env) {
      return options.environments ? options.environments.includes(env.name) : true
    },

    configResolved({ root, ...config }) {
      paths.unshift(root)
      if (config.cacheDir) {
        cacheDir = resolve(config.cacheDir, 'likec4-icons')
      }
    },

    resolveId: {
      filter: {
        id: /likec4:icon-bundle/,
      },
      handler(id) {
        return {
          id: `\0${id}`,
          resolvedBy: PLUGIN_NAME,
          moduleSideEffects: false,
        }
      },
    },

    load: {
      filter: {
        id: /likec4:icon-bundle/,
      },
      async handler(id) {
        const parts = id.split('/').slice(-2)
        if (!hasAtLeast(parts, 2)) {
          return null
        }
        const [group, icon] = parts
        const code = await iconsCache.get(`${group}:${icon}`)
        return {
          code,
        }
      },
    },
  }
}
