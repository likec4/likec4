import likec4preset from '@likec4/style-preset/src'
import {
  pluginRemoveNegativeSpacing,
  pluginStrictTokensScope,
} from '@pandabox/panda-plugins'
import { defineConfig as pandaDefineConfig } from '@pandacss/dev'

export function defineConfig(config) {
  return pandaDefineConfig({
    // Whether to use css reset
    importMap: '@likec4/styles',
    presets: [
      likec4preset,
    ],
    cssVarRoot: ':where(:root,:host)',
    forceConsistentTypeExtension: true,
    // hash: isProduction,
    // globalVars: {},
    // hash: true,
    strictTokens: true,
    validation: 'error',
    jsxFramework: 'react',
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
          'fontWeights',
          // 'cursor',
          // 'fontSizes',
          // 'sizes',
          // 'lineHeights',
          // 'shadows',
          // 'zIndex',
          // 'opacity',
          'radii',
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
