import React from 'react'
import type { DocsThemeConfig } from 'nextra-theme-docs'
import { Logo } from '$/components/logo'

const config: DocsThemeConfig = {
  logo: <Logo height={30} textFill='#FFF'/>,
  darkMode: true,
  primaryHue: 195,
  //main: ({ children }) => <main className='asd'>{children}</main>,
  project: {
    link: 'https://github.com/likec4/likec4',
  },
  docsRepositoryBase: 'https://github.com/likec4/likec4/blob/docs',
  // footer: {
  //   text: 'Nextra Docs Template',
  // },
  themeSwitch: {
    component: () => null
  }
}

export default config
