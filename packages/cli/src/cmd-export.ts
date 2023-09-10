import { createArgument, createCommand, createOption } from '@commander-js/extra-typings'
import { execa } from 'execa'
import { mkdirp } from 'mkdirp'
import { existsSync } from 'node:fs'
import { rm, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { values } from 'rambdax'
import { addProp, map } from 'remeda'
import { generateExportScript } from './export'
import { initLanguageServices, layoutViews, resolveDir } from './language-services'
import { dim, red, green, yellow } from 'kleur/colors'

async function createProject(dryRun: true | undefined) {
  const dir = join(tmpdir(), 'likec4-export')

  const packageLock = join(dir, 'package-lock.json')
  if (existsSync(packageLock)) {
    console.log(dim('exists:') + ' ' + packageLock + '\n\n')
    return dir
  }

  console.log('  ' + dim('mkdir: ' + dir))

  await mkdirp(dir)

  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: 'likec4-export',
        version: '1.0.0',
        private: true,
        engines: {
          node: '>=16'
        },
        engineStrict: true,
        dependencies: {
          puppeteer: '20.7.3'
        }
      },
      null,
      2
    )
  )

  if (dryRun !== true) {
    await execa('npm', ['install'], {
      cwd: dir,
      env: {
        NODE_ENV: 'production'
      },
      stdio: 'inherit'
    })
  } else {
    console.log(dim('dry run, skipping npm install...'))
  }

  return dir
}

type ExportOptions = {
  workspaceDir: string
  output?: string | undefined
  template?: string | undefined
  scriptCwd?: boolean | string | undefined
  dryRun?: true | undefined
  keepScripts?: true | undefined
}
export async function exportHandler({ workspaceDir, output, template, dryRun, scriptCwd, keepScripts }: ExportOptions) {
  const { workspace, model, viewSourcePaths } = await initLanguageServices({ workspaceDir })

  const modelViews = values(model.views)

  if (modelViews.length === 0) {
    console.error(red(' ⛔️  No views found'))
    process.exit(1)
  }

  console.log(dim(`🔍 Layout views...`))

  const views = map(await layoutViews(values(model.views)), d => {
    const sourcePath = viewSourcePaths[d.id]
    if (!sourcePath) {
      throw new Error(`No source path for view ${d.id}`)
    }
    return addProp(d, 'sourcePath', sourcePath)
  })

  console.log(green('✅ LikeC4 parsed\n'))

  const outputdir = output ? resolve(process.cwd(), output) : workspace

  let cwd = scriptCwd ? resolveDir(scriptCwd === true ? '.' : scriptCwd) : null
  if (cwd === null) {
    console.log(green(`Prepare temporary node project...`))
    cwd = await createProject(dryRun)
  }

  await mkdirp(outputdir)

  const exportJS = join(cwd, 'likec4-export-script.js')

  if (template) {
    template = resolve(process.cwd(), template)
    console.log(dim(`Custom template:`))
    console.log(dim(`  ${template}`))
    template = await readFile(template, { encoding: 'utf-8' })
  }

  await writeFile(exportJS, generateExportScript({ views, outputdir, ...(template ? { template } : {}) }))
  console.log(dim(`Export script:`))
  console.log(dim(`  ${exportJS}`))

  if (dryRun === true) {
    console.log(dim('dry run, skipping...'))
  } else {
    console.log('🎨 ' + green('Run script...'))
    if (cwd !== process.cwd()) {
      console.log(dim(`  $ `) + yellow(`cd ${cwd}`))
    }
    console.log(dim(`  $ `) + yellow('node likec4-export-script.js\n\n'))

    await execa('node', ['likec4-export-script.js'], {
      cwd,
      stdio: 'inherit'
    })
  }

  if (keepScripts !== true) {
    console.log('🗑️ ' + dim('remove script...'))
    await rm(exportJS, { force: true })
  } else {
    console.log(green(`\n\ngenerated script:`))
    console.log(yellow(`  ${exportJS}`))
  }

  console.log('\n' + green('✅ Done'))
}

export const exportCommand = () => {
  return createCommand('export')
    .summary('export likec4 views to png')
    .description(`Export LikeC4 views to PNG, rendering in Headless Chrome with Puppeteer`)
    .addArgument(
      createArgument('workspace', 'directory with likec4 sources').argOptional().default(process.cwd(), '"."')
    )
    .option('-t, --template <file>', 'custom HTML file\n(default: built-in template)')
    .option('-o, --output <directory>', 'directory for generated png\n(default: next to sources)')
    .option('-S, --script-cwd [path]', 'path to run export scripts\nif not defined, creates temporary folder')
    .option('--keep-scripts', 'do not delete generated scripts')
    .addOption(
      createOption('--dry-run', 'generate, but do not run export script').implies({
        keepScripts: true
      })
    )
    .action(async (workspaceDir, opts) => {
      return await exportHandler({ workspaceDir, ...opts })
    })
    .addHelpText(
      'afterAll',
      `
Examples:
  likec4 export -o ./output ./src/likec4
`
    )
}
