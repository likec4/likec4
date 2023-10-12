import React from 'react'
import type { DocsThemeConfig } from 'nextra-theme-docs'
import { useConfig } from 'nextra-theme-docs'
import { HeaderLogo } from '$/components/logo'
import { useRouter } from 'next/router'

export default {
  logo: HeaderLogo,
  // Show or hide the dark mode toggle button.
  darkMode: false,
  nextThemes: {
    defaultTheme: 'dark'
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
    text: `${new Date().getFullYear()} MIT License © LikeC4`
  },
  useNextSeoProps() {
    const { frontMatter } = useConfig()
    const { route } = useRouter()
    const url = 'https://likec4.dev' + route + (route.endsWith('/') ? '' : '/')

    const description =
      frontMatter.description ||
      'Visualize, collaborate, and evolve the software architecture with always actual and live diagrams from your code'

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
        <meta name='viewport' content={viewport} />
      </>
    )
  }
} satisfies DocsThemeConfig
