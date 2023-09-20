// @ts-check
import nextra from 'nextra'
import { resolve, dirname } from 'path'
import { codeImport } from 'remark-code-import'
import { getHighlighter, BUNDLED_LANGUAGES } from 'shiki'


const __filename = new URL(import.meta.url).pathname
const __dirname = dirname(__filename)

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  flexsearch: {
    codeblocks: false
  },
  mdxOptions: {
    remarkPlugins: [codeImport],
    rehypePrettyCodeOptions: {
      getHighlighter: options =>
        // @ts-ignore
        getHighlighter({
          ...options,
          langs: [
            ...BUNDLED_LANGUAGES,
            {
              id: 'likec4',
              scopeName: 'source.likec4',
              path: resolve('resources', 'likec4.tmLanguage.json')
            },
            {
              id: 'structurizr',
              scopeName: 'source.structurizr',
              path: resolve('resources', 'structurizr.tmLanguage.json')
            }
          ]
        })
    }
  }
})

export default withNextra({
  reactStrictMode: true,
  trailingSlash: true,
  // modularizeImports: true,
  experimental: {
    esmExternals: true,
    //serverComponentsExternalPackages: ['langium','konva']
    // swcPlugins: [['@swc-jotai/debug-label', {}]],
  },
  webpack: function (config, options) {
    // config.experiments.asyncWebAssembly = true
    // console.log('config.experiments', config.experiments)
    config.module.rules.push({
      test: /\.(mp3|wasm)$/i,
      type: 'asset/resource'
    })
    config.resolve.alias = {
      ...config.resolve.alias,
      '@likec4/diagrams': resolve(__dirname, '../packages/diagrams/src')
    }
    return config
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  output: 'export',
  transpilePackages: [
    'jotai-devtools',
    'monaco-editor',
    'monaco-languageclient',
    'langium/node',
    'langium',
    'chevrotain',
    'chevrotain-allstar',
    '@likec4/core/compute-view',
    '@likec4/core/utils',
    '@likec4/core/errors',
    '@likec4/core/types',
    '@likec4/core/colors',
    '@likec4/core',
    '@likec4/diagrams',
    '@likec4/generators',
    '@likec4/language-server',
    '@likec4/layouts'
  ],
  typescript: {
    tsconfigPath: './tsconfig.next.json',
    // There is a task "compile"
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: true
  }
})
