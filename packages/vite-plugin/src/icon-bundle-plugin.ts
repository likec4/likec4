import { DefaultMap } from '@likec4/core'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
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

  const iconsCache = new DefaultMap(async (key: `${string}:${string}`) => {
    let [group, icon] = key.split(':') as ['aws' | 'azure' | 'gcp' | 'tech', string]
    if (icon.endsWith('.jsx') || icon.endsWith('.js')) {
      icon = icon.slice(0, icon.lastIndexOf('.'))
    }
    logger.debug(k.dim(`resolving `) + k.green(`${group}:${icon}`))
    try {
      const resolvedPath = require.resolve(`@likec4/icons/${group}/${icon}`, {
        paths: paths,
      })
      logger.trace(k.dim(`resolved local `) + resolvedPath)
      return await readFile(resolvedPath, 'utf-8')
    } catch {
      // ignore
    }
    const url = `https://icons.like-c4.dev/${group}/${icon}.js`
    logger.trace(k.dim(`fetching `) + url)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch icon: ${response.status} ${response.statusText}`)
    }
    return await response.text()
  })

  return {
    name: PLUGIN_NAME,

    applyToEnvironment(env) {
      return options.environments ? options.environments.includes(env.name) : true
    },

    configResolved({ root }) {
      paths.unshift(root)
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
          syntheticNamedExports,
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
