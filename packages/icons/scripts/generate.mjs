import { build } from 'esbuild'
import { fdir } from 'fdir'
import { writeFile } from 'node:fs/promises'
import { sep } from 'path'

console.info('Generating all.js and all.d.ts')

const files = new fdir()
  .glob('**/*.tsx')
  .withFullPaths()
  .crawl()
  .sync()
  .sort()

console.info('Found %s icons', files.length)

const {
  imports,
  icons,
  types,
} = files.reduce(
  /**
   * @param {{
   *  imports: string[]
   *  icons: string[]
   *  types: string[]
   * }} acc
   * @param {string} path
   * @returns
   */
  (acc, path) => {
    const parts = path.split(sep)
    const icon = (parts.pop() || 'invalid').replace('.tsx', '')
    const group = parts.pop() || 'error'

    const Component = [
      group[0].toUpperCase(),
      group.substring(1),
      icon[0].toUpperCase(),
      icon.substring(1).replaceAll('-', '').replaceAll('_', ''),
    ].join('')

    acc.imports.push(`import ${Component} from './${group}/${icon}'`)
    acc.icons.push(`  '${group}:${icon}': ${Component},`)
    acc.types.push(`  readonly '${group}:${icon}': SvgIcon;`)
    return acc
  },
  {
    imports: [],
    icons: [],
    types: [],
  },
)

// Write the typescript file
await writeFile(
  'all.d.ts',
  `
import type { SVGProps, JSX } from 'react';
type SvgIcon = (props: SVGProps<SVGSVGElement>) => JSX.Element;
export declare const Icons: {
${types.join('\n')}
};
export type IconName = keyof typeof Icons;

export type IconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | null | undefined
  }
}
export function IconRenderer(props: IconRendererProps): JSX.Element;

export type BundledIconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName;
};
export default function BundledIcon({ name, ...props }: BundledIconProps): JSX.Element;
`,
)

// Write the javascript file
await writeFile(
  'all.js',
  `
import { jsx } from "react/jsx-runtime";
${imports.join('\n')}
export const Icons = {
${icons.join('\n')}
}

export function IconRenderer({ node }) {
  if (!node.icon || node.icon === 'none') {
    return null
  }
  const IconComponent = Icons[node.icon ?? ''];
  return IconComponent ? jsx(IconComponent, { ...props }) : null;
}

export default function BundledIcon({ name, ...props }) {
  const IconComponent = Icons[name];
  return IconComponent ? jsx(IconComponent, { ...props }) : null;
}
`,
)

console.info('Generate js for all icons')

await build({
  entryPoints: [
    '**/*.tsx',
    '**/index.ts',
  ],
  sourceRoot: '.',
  outdir: '.',
  minify: true,
  tsconfigRaw: {
    compilerOptions: {
      module: 'esnext',
      target: 'esnext',
      verbatimModuleSyntax: true,
      jsx: 'react-jsx',
    },
  },
  jsxDev: false,
  format: 'esm',
})
