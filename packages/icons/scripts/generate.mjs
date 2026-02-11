import { build } from 'esbuild'
import { fdir } from 'fdir'
import { cp, writeFile } from 'node:fs/promises'
import { sep, relative } from 'node:path'
import { $ } from 'zx'

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
   *  icons: Record<'aws' | 'azure' | 'gcp' | 'tech' | 'bootstrap', Record<string, string>>
   *  types: Record<'aws' | 'azure' | 'gcp' | 'tech' | 'bootstrap', string[]>
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
    acc.icons[group][icon] = Component
    acc.types[group] ??= []
    acc.types[group].push(icon)
    return acc
  },
  {
    imports: [],
    icons: {
      aws: {},
      azure: {},
      gcp: {},
      tech: {},
      bootstrap: {},
    },
    types: {
      aws: [],
      azure: [],
      gcp: [],
      tech: [],
      bootstrap: [],
    },
  },
)

// Write the typescript file
await writeFile(
  'all.d.ts',
  `
import type { SVGProps, JSX } from 'react';

type SvgIcon = (props: SVGProps<SVGSVGElement>) => JSX.Element;

export type AwsIconName =
${types.aws.map((icon) => `  | '${icon}'`).join('\n')};

export type AzureIconName =
${types.azure.map((icon) => `  | '${icon}'`).join('\n')};

export type GcpIconName =
${types.gcp.map((icon) => `  | '${icon}'`).join('\n')};

export type TechIconName =
${types.tech.map((icon) => `  | '${icon}'`).join('\n')};

export type BootstrapIconName =
${types.bootstrap.map((icon) => `  | '${icon}'`).join('\n')};

export type IconName =
  | \`aws:\${AwsIconName}\`
  | \`azure:\${AzureIconName}\`
  | \`gcp:\${GcpIconName}\`
  | \`tech:\${TechIconName}\`
  | \`bootstrap:\${BootstrapIconName}\`;

export declare const Icons: {
  aws: {
    [key in AwsIconName]: SvgIcon
  }
  azure: {
    [key in AzureIconName]: SvgIcon
  }
  gcp: {
    [key in GcpIconName]: SvgIcon
  }
  tech: {
    [key in TechIconName]: SvgIcon
  }
  bootstrap: {
    [key in BootstrapIconName]: SvgIcon
  }
};

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

const printEntries = (icons) => {
  return Object.entries(icons).map(([key, value]) => `    '${key}': ${value}`).join(',\n')
}
// Write the javascript file
await writeFile(
  'all.js',
  `
import { jsx } from "react/jsx-runtime";
${imports.join('\n')}
export const Icons = {
  aws: {
${printEntries(icons.aws)}
  },
  azure: {
${printEntries(icons.azure)}
  },
  gcp: {
${printEntries(icons.gcp)}
  },
  tech: {
${printEntries(icons.tech)}
  },
  bootstrap: {
${printEntries(icons.bootstrap)}
  }
}

function IconComponent(icon) {
  try {
    const [group, name] = icon.split(':')
    return Icons[group][name]
  } catch (e) {
    console.error(\`Icon not found \${icon}\`, e)
    return null
  }
}

export function IconRenderer({ node, ...props }) {
  if (!node.icon || node.icon === 'none') {
    return null
  }
  const Icon = IconComponent(node.icon);
  return Icon ? jsx(Icon, { ...props }) : null;
}

export default function BundledIcon({ name, ...props }) {
  const Icon = IconComponent(name);
  return Icon ? jsx(Icon, { ...props }) : null;
}
`,
)

console.info('Generate js for all icons')

const indexFiles = new fdir()
  .glob('**/index.ts')
  .withBasePath()
  .crawl()
  .sync()
  .filter((p) => !p.includes('node_modules'))
const entryPoints = [
  ...files.map((f) => relative(process.cwd(), f)),
  ...indexFiles,
]

await build({
  entryPoints,
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

console.info('Creating index.d.ts')

$.stdio = 'inherit'
for (const fname of new fdir().glob('**/index.ts').withBasePath().crawl().sync()) {
  console.info('Copy %s', fname)
  await cp(fname, fname.replace('.ts', '.d.ts'))
}
