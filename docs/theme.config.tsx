import { HeaderLogo } from '$/components/logo'
import { useRouter } from 'next/router'
import type { DocsThemeConfig } from 'nextra-theme-docs'
import { useConfig } from 'nextra-theme-docs'
import React from 'react'

export default {
  logo: HeaderLogo,
  // Show or hide the dark mode toggle button.
  darkMode: false,
  nextThemes: {
    defaultTheme: 'dark'
  },
  banner: {
    key: '1.0.0',
    text: (
      <a href="https://docs.likec4.dev/" target="_blank">
        🎉 1.0.0 is released. Documentation is moving here →
      </a>
    )
  },
  primaryHue: 195,
  sidebar: {
    autoCollapse: true,
    toggleButton: true
  },
  // main: Main,
  project: {
    link: 'https://github.com/likec4/likec4'
  },
  docsRepositoryBase: 'https://github.com/likec4/likec4/blob/main/docs',
  footer: {
    // component: () => null,
    text: `2023-${new Date().getFullYear()} MIT License © LikeC4`
  },
  useNextSeoProps() {
    const { frontMatter } = useConfig()
    const { route } = useRouter()
    const url = 'https://likec4.dev' + route + (route.endsWith('/') ? '' : '/')

    const description = frontMatter.description
      || 'Visualize, collaborate, and evolve the software architecture with always actual and live diagrams from your code'

    return {
      ...(frontMatter.title
        ? {
          title: frontMatter.title,
          titleTemplate: '%s'
        }
        : {
          titleTemplate: route.startsWith('/examples/bigbank')
            ? 'Example Big Bank: %s'
            : '%s – LikeC4'
        }),
      description,
      themeColor: '#111',
      noindex: route.startsWith('/playground'),
      nofollow: route.startsWith('/playground'),
      openGraph: {
        url,
        images: [
          {
            url: 'https://likec4.dev/logo.png'
          }
        ]
      },
      additionalMetaTags: [
        { name: 'keywords', content: 'software, architecture, architecture-as-code, diagrams, c4' }
      ]
    }
  },
  head: function useHead() {
    const { route } = useRouter()
    const isZoomDisabled = route.startsWith('/playground')

    const viewport = isZoomDisabled
      ? 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no'
      : 'width=device-width, initial-scale=1.0'

    return (
      <>
        <meta name="viewport" content={viewport} />
      </>
    )
  }
} satisfies DocsThemeConfig
