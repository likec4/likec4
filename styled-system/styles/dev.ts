import likec4preset from '@likec4/style-preset/src'
import { pluginRemoveNegativeSpacing, pluginStrictTokensScope } from '@pandabox/panda-plugins'
import { type Config, defineConfig as pandaDefineConfig } from '@pandacss/dev'
import { isDevelopment, isProduction } from 'std-env'

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
    hash: isProduction,
    // globalVars: {},
    strictTokens: true,
    jsxFramework: 'react',
    logLevel: isDevelopment ? 'debug' : 'info',
    plugins: [
      // pluginMissingCssWarnings(),
      // @ts-ignore
      pluginStrictTokensScope({ categories: ['fonts', 'colors', 'animations'] }),
      // @ts-ignore
      pluginRemoveNegativeSpacing({ spacingTokenType: true, tokenType: true }),
    ],
    ...config,
  })
}
