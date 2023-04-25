import nextra from 'nextra'
import { resolve } from 'path'
import { codeImport } from 'remark-code-import';
import { getHighlighter, BUNDLED_LANGUAGES } from 'shiki'

/** @type {import('nextra').NextraConfig} */
const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  flexsearch: {
    codeblocks: false
  },
  mdxOptions: {
    remarkPlugins: [
      codeImport
    ],
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
  output: 'export',
  images: {
    unoptimized: true
  }
}

export default withNextra(nextConfig)
