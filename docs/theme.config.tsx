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
  darkMode: true,
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
  themeSwitch: {
    component: () => null
  },
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
      description: 'Visualize, collaborate, and evolve the software architecture with always actual and live diagrams from your code',
      themeColor: '#111',
      openGraph: {
        url,
        images: [{
          url: 'https://likec4.dev/logo.png',
          type: 'image/png'
        }]
      },
      additionalMetaTags: [
        {name: 'keywords', content: 'software, architecture, architecture-as-code, diagrams, c4'},
        route.startsWith('/playground') ? {name: 'robots', content: 'noindex'} : []
      ].flat()
    }
  },
  head: function () {
    const { route } = useRouter()
    const isZoomDisabled = route.startsWith('/playground')
    return (<>
      {isZoomDisabled ? (
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
      ) : (
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      )}
    </>)
  }
} satisfies DocsThemeConfig
