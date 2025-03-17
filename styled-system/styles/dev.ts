import likec4preset from '@likec4/style-preset'
import { pluginMissingCssWarnings, pluginRemoveNegativeSpacing, pluginStrictTokensScope } from '@pandabox/panda-plugins'
import { type Config, defineConfig as pandaDefineConfig } from '@pandacss/dev'

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
    // globalVars: {},
    strictTokens: true,
    jsxFramework: 'react',
    logLevel: 'info',
    plugins: [
      pluginMissingCssWarnings(),
      pluginStrictTokensScope({ categories: ['fonts', 'colors', 'animations'] }),
      pluginRemoveNegativeSpacing({ spacingTokenType: true, tokenType: true }),
    ],
    ...config,
  })
}
