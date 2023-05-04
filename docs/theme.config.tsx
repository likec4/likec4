import React from 'react'
import type { DocsThemeConfig} from 'nextra-theme-docs';
import { useConfig} from 'nextra-theme-docs';
import { Logo } from '$/components/logo'

const config: DocsThemeConfig = {
  logo: <Logo height={30} textFill='#FFF' />,
  darkMode: true,
  primaryHue: 195,
  sidebar: {
    toggleButton: true,
  },
  //main: ({ children }) => <main className='asd'>{children}</main>,
  project: {
    link: 'https://github.com/likec4/likec4',
  },
  docsRepositoryBase: 'https://github.com/likec4/likec4/blob/main/docs',
  themeSwitch: {
    component: () => null
  },
  footer: {
    text: `MIT ${new Date().getFullYear()} LikeC4`
  },
  useNextSeoProps: () => {
    const { frontMatter } = useConfig()
    if (frontMatter.title) {
      return {
        title: frontMatter.title,
      }
    }
    return {
      titleTemplate: '%s – LikeC4'
    }
  },
  // useNextSeoProps: () => ({ titleTemplate: '%s – LikeC4' })
}

export default config
