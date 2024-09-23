import consola from 'consola'
import { build } from 'esbuild'
import { globSync } from 'glob'
import { writeFile } from 'node:fs/promises'
import { sep } from 'path'

consola.info('Generating all.js and all.d.ts')

const {
  imports,
  icons,
  types
} = globSync(`*/*.tsx`).toSorted().reduce(
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
      icon.substring(1).replaceAll('-', '').replaceAll('_', '')
    ].join('')

    acc.imports.push(`import ${Component} from './${group}/${icon}'`)
    acc.icons.push(`  '${group}:${icon}': ${Component},`)
    acc.types.push(`  readonly '${group}:${icon}': SvgIcon;`)
    return acc
  },
  {
    imports: [],
    icons: [],
    types: []
  }
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
export type IconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName;
};
export default function BundledIcon({ name, ...props }: IconProps): JSX.Element;
`
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
export default function BundledIcon({ name, ...props }) {
  const IconComponent = Icons[name];
  return IconComponent ? jsx(IconComponent, { ...props }) : null;
}
`
)

consola.info('Generate js for all icons')

await build({
  entryPoints: [
    '**/*.tsx',
    '**/index.ts'
  ],
  sourceRoot: '.',
  outdir: '.',
  minifyWhitespace: false,
  minifyIdentifiers: true,
  minifySyntax: true,
  format: 'esm',
  target: 'esnext',
  platform: 'browser'
})
