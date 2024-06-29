import { consola } from 'consola'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { cwd as cwdFn } from 'node:process'
import { packageUp as pkgUp, packageUpSync as pkgUpSync } from 'package-up'
import k from 'picocolors'
import { LanguageServices } from '../../../language-services'
import { startTimer } from '../../../logger'
import { writeSources } from '../react-next/write-sources'
import { writePackageJson } from './packageJson'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  useDotBin: boolean
  pkgName?: string | undefined
  pkgOutDir?: string | undefined
}

async function resolvePkgOutDir() {
  const cwd = cwdFn()
  const pkgup = await pkgUp()
  let pkgOutDir = pkgup ? resolve(dirname(pkgup), '.likec4') : resolve(cwd, '.likec4')

  const pkgJsonPath = resolve(pkgOutDir, 'package.json')
  if (existsSync(pkgJsonPath)) {
    return {
      pkgOutDir
    }
  }
  const cwdRelative = relative(cwd, pkgOutDir)
  if (existsSync(pkgOutDir)) {
    const yes = await consola.prompt('Use this path as output?\n - ' + cwdRelative, {
      type: 'confirm',
      initial: true
    })
    if (yes) {
      return {
        pkgOutDir
      }
    }
  }
  pkgOutDir = await consola.prompt('Enter output path', {
    initial: cwdRelative,
    type: 'text'
  })
  return {
    pkgOutDir
  }
}

export async function handler({ path, useDotBin, ...outparams }: HandlerParams) {
  const cwd = cwdFn()
  const timer = startTimer()

  const languageServices = await LanguageServices.get({ path, useDotBin })

  const diagrams = [...await languageServices.views.diagrams()]
  if (diagrams.length === 0) {
    consola.error('no views found')
    process.exitCode = 1
    throw new Error('no views found')
  }

  let { pkgName, pkgOutDir } = outparams

  if (!pkgOutDir) {
    const found = await resolvePkgOutDir()
    pkgOutDir = found.pkgOutDir
  }

  pkgOutDir = resolve(cwd, pkgOutDir)
  if (!existsSync(pkgOutDir)) {
    consola.info(`${k.dim('mk package dir')} ${relative(cwd, pkgOutDir)}`)
    await mkdir(pkgOutDir, { recursive: true })
  } else {
    consola.info(`${k.dim('package dir')} ${relative(cwd, pkgOutDir)}`)
  }

  const pkgJsonPath = resolve(pkgOutDir, 'package.json')
  let isNewPackage = true
  if (existsSync(pkgJsonPath)) {
    isNewPackage = false
    consola.info(`${k.dim('found package.json')} ${relative(cwd, pkgJsonPath)}`)
    const pkgJsonString = await readFile(pkgJsonPath, { encoding: 'utf-8' })
    const pkgJson = JSON.parse(pkgJsonString)
    if (pkgName && pkgName !== pkgJson.name) {
      consola.warn(`${k.dim('package names are different')} ${pkgName} ${k.dim('!==')} ${pkgJson.name}`)
    } else {
      consola.info(`${k.dim('package name')} ${pkgJson.name}`)
    }
    pkgName = pkgJson.name
  }

  if (!pkgName) {
    isNewPackage = true
    pkgName = await consola.prompt('Package name:', {
      type: 'text',
      initial: '@likec4/views'
    })
  }

  if (isNewPackage) {
    await writePackageJson({ pkgName, pkgJsonPath })
    consola.info(`${k.dim('wrote package.json')} ${relative(cwd, pkgJsonPath)}`)
  }

  consola.info(`${k.dim('generate sources to:')} ${relative(cwd, pkgOutDir)}`)
  await writeSources({
    outputDir: pkgOutDir,
    diagrams
  })

  let pkgUp = pkgUpSync()
  if (pkgUp && existsSync(pkgUp)) {
    const relativePkgUp = relative(cwd, pkgUp)
    consola.info(`${k.dim('found package.json')} ${pkgUp}`)
    const pkgJsonString = await readFile(pkgUp, { encoding: 'utf-8' })
    const pkgJson = JSON.parse(pkgJsonString)
    pkgJson.dependencies ??= {}

    const dependencyFilePath = 'file:' + relative(dirname(pkgUp), pkgOutDir) + '/'

    if (pkgJson.dependencies[pkgName]) {
      consola.info(`${k.dim(`existing dependency`)} "${pkgName}":"${pkgJson.dependencies[pkgName]}"`)
      if (pkgJson.dependencies[pkgName] !== dependencyFilePath) {
        consola.warn(`${k.dim('invalid dependency, should be')} "${pkgName}":"${dependencyFilePath}"`)
        const yes = await consola.prompt('Do you want to change?', {
          type: 'confirm',
          initial: false
        })
        if (yes) {
          pkgJson.dependencies[pkgName] = dependencyFilePath
          await writeFile(pkgUp, JSON.stringify(pkgJson, null, 2))
        }
      }
    } else if (!pkgJson.dependencies[pkgName]) {
      const yes = await consola.prompt(`Add ${pkgName} as dependency to ${relativePkgUp}?`, {
        type: 'confirm',
        initial: true
      })
      if (yes) {
        pkgJson.dependencies[pkgName] = dependencyFilePath
        await writeFile(pkgUp, JSON.stringify(pkgJson, null, 2))
      }
    }
  } else {
    consola.warn(`no package.json found`)
    consola.info(`To use generated package, add dependency:\n

  "${pkgName}": "file:${pkgOutDir}"

  or

  "${pkgName}": "link:${pkgOutDir}"

`)
  }

  if (isNewPackage) {
    consola.info(`depends on your node package manager, but most probably you need:

  $ cd ${pkgOutDir}
  $ npm install

`)
  }

  timer.stopAndLog()
}
