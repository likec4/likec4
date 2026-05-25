import likec4preset from '@likec4/style-preset/src'
import { defineConfig as pandaDefineConfig } from '@pandacss/dev'

export function defineConfig(config) {
  return pandaDefineConfig({
    // Whether to use css reset
    clean: false,
    importMap: {
      css: '@likec4/styles/css',
      recipes: '@likec4/styles/recipes',
      patterns: '@likec4/styles/patterns',
      jsx: '@likec4/styles/jsx',
    },
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
    // plugins: [
    //   // @ts-ignore
    //   // pluginRemoveUnusedCss(),
    //   // @ts-ignore
    //   pluginStrictTokensScope({
    //     categories: [
    //       'fonts',
    //       'colors',
    //       'animations',
    //       'easings',
    //       'spacing',
    //       'fontWeights',

    //       // 'cursor',
    //       // 'fontSizes',
    //       // 'sizes',
    //       // 'lineHeights',
    //       // 'shadows',
    //       // 'zIndex',
    //       // 'opacity',
    //       'radii',
    //       // 'borders',
    //       // 'durations',
    //       // 'letterSpacings',
    //       // 'gradients',
    //       // 'assets',
    //       // 'borderWidths',
    //       // 'aspectRatios',
    //       // 'containerNames',
    //     ],
    //   }),
    //   // @ts-ignore
    //   pluginRemoveNegativeSpacing({ spacingTokenType: true, tokenType: true }),
    // ],
    ...config,
  })
}
