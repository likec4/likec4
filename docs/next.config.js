import nextra from 'nextra'
import { resolve } from 'path'
import { codeImport } from 'remark-code-import'
import { getHighlighter, BUNDLED_LANGUAGES } from 'shiki'

/** @type {import('nextra').NextraConfig} */
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  webpack: function (config, options) {
    // config.experiments.asyncWebAssembly = true
    // console.log('config.experiments', config.experiments)
    config.module.rules.push({
      test: /\.(mp3|wasm)$/i,
      type: 'asset/resource'
    })
    // config.resolve.alias = {
    //   ...config.resolve.alias,
    //   '@likec4/core': '@likec4/core/dist',
    //   '@likec4/layouts': '@likec4/layouts/dist',
    //   '@likec4/language-server': '@likec4/language-server/dist',
    // }
    return config
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  output: 'export',
  transpilePackages: [
    '@likec4/language-server'
  ],
  typescript: {
    tsconfigPath: './tsconfig.next.json'
  },
  images: {
    unoptimized: true
  }
}

export default withNextra(nextConfig)
