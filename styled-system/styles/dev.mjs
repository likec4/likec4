import { likec4preset } from '@likec4/style-preset/src'
import { defineConfig as pandaDefineConfig } from '@pandacss/dev'

/**
 * @param {Omit<import('@pandacss/types').Config, 'importMap' | 'presets' | 'plugins'>} config
 * @returns {import('@pandacss/types').Config}
 */
export function defineConfig(config) {
  return pandaDefineConfig({
    // preflight: true,
    importMap: '@likec4/styles',
    presets: [
      likec4preset,
    ],
    cssVarRoot: ':where(:root,:host)',
    forceConsistentTypeExtension: true,
    strictTokens: true,
    validation: 'error',
    jsxFramework: 'react',
    ...config,
  })
}
