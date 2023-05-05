import React from 'react'
import type { DocsThemeConfig } from 'nextra-theme-docs'
import { useConfig } from 'nextra-theme-docs'
import { Logo } from '$/components/logo'
import { useRouter } from 'next/router'

const config: DocsThemeConfig = {
  logo: <Logo height={30} textFill='#FFF' />,
  darkMode: true,
  primaryHue: 195,
  sidebar: {
    toggleButton: true,
  },
  // main: Main,
  project: {
    link: 'https://github.com/likec4/likec4',
  },
  docsRepositoryBase: 'https://github.com/likec4/likec4/blob/main/docs',
  themeSwitch: {
    component: () => null
  },
  nextThemes: {
    defaultTheme: 'dark',
    forcedTheme: 'dark'
  },
  footer: {
    // component: () => null,
    text: `MIT ${new Date().getFullYear()} LikeC4`
  },
  useNextSeoProps: () => {
    const { frontMatter } = useConfig()
    const { route } = useRouter()
    return {
      ...(frontMatter.title ? {
        title: frontMatter.title,
        titleTemplate: '%s',
      } : {
        titleTemplate: route.startsWith('/examples/bigbank')
            ? 'Example Big Bank: %s'
            : '%s – LikeC4',
      }),
      description: 'Architecture diagrams from the code - always consistent, up-to-date and with the history',
      themeColor: '#111',
      openGraph: {
        url: 'https://likec4.dev' + route,
        images: [{
          url: 'https://likec4.dev/logo.png',
          type: 'image/png',
          width: 1154,
          height: 580
        }]
      },
      // additionalMetaTags: [{
      //   name: 'viewport',
      //   content: isZoomDisabled ? 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no' :
      //     'width=device-width, initial-scale=1.0'
      // }]
    }
  },
  head: function () {
    const { route } = useRouter()
    const isZoomDisabled = route.startsWith('/examples') || route.startsWith('/playground')
    return (<>
      {isZoomDisabled ? (
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
      ) : (
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      )}
    </>)
  }
  // useNextSeoProps: () => ({ titleTemplate: '%s – LikeC4' })
  // head: function useHead() {
  //   const { title } = useConfig()
  //   const { route } = useRouter()
  //   const socialCard = 'https://likec4.dev/logo.png'

  //   const isZoomDisabled = route.startsWith('/examples') || route.startsWith('/playground')

  //   return (
  //     <>
  //       <meta name="msapplication-TileColor" content="#111" />
  //       <meta name="theme-color" content="#111" />
  //       {isZoomDisabled ? (
  //         <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
  //       ): (
  //         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  //       )}
  //       <meta httpEquiv="Content-Language" content="en" />
  //       <meta
  //         name="description"
  //         content="Architecture diagrams from the code - always consistent, up-to-date and with the history"
  //       />
  //       <meta
  //         name="og:description"
  //         content="Architecture diagrams from the code - always consistent, up-to-date and with the history"
  //       />
  //       <meta name="twitter:card" content="summary_large_image" />
  //       <meta name="twitter:image" content={socialCard} />
  //       <meta name="twitter:site:domain" content="likec4.dev" />
  //       <meta name="twitter:url" content="https://likec4.dev" />
  //       <meta name="og:image" content={socialCard} />
  //       <link rel="icon" href="/favicon.png" type="image/png" />
  //     </>
  //   )
  // },
}

export default config
