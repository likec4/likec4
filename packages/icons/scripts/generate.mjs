import consola from 'consola'
import { $ } from 'execa'
import { globSync } from 'glob'
import { writeFile } from 'node:fs/promises'

consola.info('Generating all.tsx...')

const {
  imports,
  icons
} = globSync(`src/*/*.tsx`).toSorted().reduce(
  /**
   * @param {{
   *  imports: string[]
   *  icons: string[]
   * }} acc
   * @param {string} path
   * @returns
   */
  (acc, path) => {
    const parts = path.split('/')
    const icon = (parts.pop() || 'invalid').replace('.tsx', '')
    const group = parts.pop() || 'error'

    const Component = [
      group[0].toUpperCase(),
      group.substring(1),
      icon[0].toUpperCase(),
      icon.substring(1).replaceAll('-', '').replaceAll('_', '')
    ].join('')

    acc.imports.push(`import ${Component} from './${group}/${icon}'`)
    acc.icons.push(`  '${group}:${icon}': ${Component} as SvgIcon,`)
    return acc
  },
  {
    imports: [],
    icons: []
  }
)

const Source = `import type { SVGProps, JSX } from 'react'

${imports.join('\n')}

type SvgIcon = (props: SVGProps<SVGSVGElement>) => JSX.Element

export const Icons = {
${icons.join('\n')}
} as const

export type IconName = keyof typeof Icons

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  /**
   * From the list of icons
   */
  name: IconName
}

export default function BundledIcon({ name, ...props }: IconProps) {
  const IconComponent = Icons[name]
  return IconComponent ? <IconComponent {...props}/> : null
}
`

await writeFile('src/all.tsx', Source)

consola.info('Build typescript')

await $`tsc`
