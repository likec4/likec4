import nextra from 'nextra'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // transpilePackages: ['@likec4/diagrams'],
}

export default withNextra(nextConfig)
