import likec4preset from '@likec4/style-preset'
import {
  pluginRemoveNegativeSpacing,
  pluginStrictTokensScope,
} from '@pandabox/panda-plugins'
import { type Config, defineConfig as pandaDefineConfig } from '@pandacss/dev'

export function defineConfig(config: Omit<Config, 'importMap' | 'presets' | 'plugins'>) {
  return pandaDefineConfig({
    // Whether to use css reset
    importMap: '@likec4/styles',
    presets: [
      likec4preset,
    ],
    cssVarRoot: ':where(:host, :root)',
    // hash: isProduction,
    // globalVars: {},
    // hash: true,
    strictTokens: true,
    jsxFramework: 'react',
    logLevel: 'info',
    plugins: [
      // @ts-ignore
      // pluginRemoveUnusedCss(),
      // @ts-ignore
      pluginStrictTokensScope({
        categories: [
          'fonts',
          'colors',
          'animations',
          'easings',
          'spacing',
          // 'sizes',
          // 'lineHeights',
          // 'shadows',
          // 'zIndex',
          // 'opacity',
          // 'radii',
          // 'borders',
          // 'durations',
          // 'letterSpacings',
          // 'gradients',
          // 'assets',
          // 'borderWidths',
          // 'aspectRatios',
          // 'containerNames',
        ],
      }),
      // @ts-ignore
      pluginRemoveNegativeSpacing({ spacingTokenType: true, tokenType: true }),
    ],
    ...config,
  })
}
