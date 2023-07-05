import React from 'react'
import type { DocsThemeConfig } from 'nextra-theme-docs'
import { useConfig } from 'nextra-theme-docs'
import { Logo } from '$/components/logo'
import { useRouter } from 'next/router'
import { cn } from './lib'

const logo = (
  <span className={cn(
    'inline-block h-[28px] pr-4'
  )}>
    <Logo className='w-auto h-full'/>
  </span>
)

export default {
  logo,
  // Show or hide the dark mode toggle button.
  darkMode: false,
  nextThemes: {
    defaultTheme: 'dark',
  },
  primaryHue: 195,
  sidebar: {
    toggleButton: true,
  },
  // main: Main,
  project: {
    link: 'https://github.com/likec4/likec4',
  },
  docsRepositoryBase: 'https://github.com/likec4/likec4/blob/develop/docs',
  footer: {
    // component: () => null,
    text: `${new Date().getFullYear()} MIT License © LikeC4`
  },
  useNextSeoProps() {
    const { frontMatter } = useConfig()
    const { route } = useRouter()
    const url = 'https://likec4.dev' + route + (route.endsWith('/') ? '' : '/')
    return {
      ...(frontMatter.title ? {
        title: frontMatter.title,
        titleTemplate: '%s',
      } : {
        titleTemplate: route.startsWith('/examples/bigbank')
            ? 'Example Big Bank: %s'
            : '%s – LikeC4',
      }),
      ...(frontMatter.description ? {
        description: frontMatter.description,
      } : {
        titleTemplate: route.startsWith('/examples/bigbank')
            ? 'Example Big Bank: %s'
            : '%s – LikeC4',
      }),
      description: 'Visualize, collaborate, and evolve the software architecture with always actual and live diagrams from your code',
      themeColor: '#111',
      noindex: route.startsWith('/playground'),
      nofollow: route.startsWith('/playground'),
      openGraph: {
        url,
        images: [{
          url: 'https://likec4.dev/logo.png',
          type: 'image/png'
        }]
      },
      additionalMetaTags: [
        {name: 'keywords', content: 'software, architecture, architecture-as-code, diagrams, c4'},
      ]
    }
  },
  head: function useHead() {
    const { route } = useRouter()
    const isZoomDisabled = route.startsWith('/playground')

    const viewport = isZoomDisabled ? 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no' : 'width=device-width, initial-scale=1.0'

    return (
      <>
        <meta name="viewport" content={viewport} />
      </>
    )
  }
} satisfies DocsThemeConfig
