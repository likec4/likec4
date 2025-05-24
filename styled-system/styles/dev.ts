import {
  pluginRemoveNegativeSpacing,
  pluginStrictTokensScope,
} from '@pandabox/panda-plugins'
import { type Config, defineConfig as pandaDefineConfig } from '@pandacss/dev'
import likec4preset from './preset'

export function defineConfig(config: Config) {
  return pandaDefineConfig({
    // Whether to use css reset
    importMap: {
      css: '@likec4/styles/css',
      recipes: '@likec4/styles/recipes',
      patterns: '@likec4/styles/patterns',
      jsx: '@likec4/styles/jsx',
    },
    presets: [
      likec4preset,
    ],
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
      pluginStrictTokensScope({ categories: ['fonts', 'colors', 'animations', 'easings'] }),
      // @ts-ignore
      pluginRemoveNegativeSpacing({ spacingTokenType: true, tokenType: true }),
    ],
    ...config,
  })
}
