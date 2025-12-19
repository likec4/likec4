import { defineCommand } from 'citty'
import type { PackageJson } from 'type-fest'
import { $, chalk, echo, fs, path } from 'zx'

type PnpmPackage = {
  path: string
  name: string
  version: string
  dependencies: Record<string, {
    from: string
    version: string
    resolved: string
    path: string
  }>
}

async function readPackageJson(pkg: PnpmPackage): Promise<PackageJson> {
  return await fs.readJson(
    path.join(pkg.path, 'package.json'),
  )
}

async function writePackageJson(pkg: PnpmPackage, content: PackageJson): Promise<void> {
  await fs.writeJson(path.join(pkg.path, 'package.json'), content, { spaces: 2 })
}

export default defineCommand({
  meta: {
    name: 'sync-version',
    description: 'Sync version of current package (from working directory) with likec4 package',
  },
  args: {
    // cwd: {
    //   type: 'string',
    //   description: 'change working directory',
    //   required: false,
    // },
  },
  async run() {
    process.env.FORCE_COLOR = '1'
    $.preferLocal = true

    $.cwd = process.cwd()

    const [currentPkg] = await $`pnpm ls -P --json`.json<[PnpmPackage]>()

    // Read likec4 package info
    const [likec4Pkg] = await $`pnpm ls -P --json --filter=likec4`.json<[PnpmPackage]>()

    if (currentPkg.name === likec4Pkg.name) {
      echo(chalk.red('Current package is likec4 itself, cannot sync version'))
      process.exit(1)
    }

    echo(chalk.green('likec4 version:') + ` ${likec4Pkg.version}`)
    echo(chalk.green(`current:`) + ` ${currentPkg.name}@${currentPkg.version}`)

    if (currentPkg.version === likec4Pkg.version) {
      echo(chalk.yellow('Versions are already in sync'))
      return process.exit(0)
    }

    const packageJson: PackageJson = await readPackageJson(currentPkg)
    packageJson.version = likec4Pkg.version

    await writePackageJson(currentPkg, packageJson)

    echo(chalk.green('✅ version updated to') + ` ${likec4Pkg.version}`)
  },
})
