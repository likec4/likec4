import { createArgument, createCommand, createOption } from '@commander-js/extra-typings'
import { execa } from 'execa'
import { mkdirp } from 'mkdirp'
import { existsSync } from 'node:fs'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { values } from 'rambdax'
import { addProp, map } from 'remeda'
import { generateExportScript, generateViewsData } from './export'
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
  scriptCwd?: boolean | string | undefined
  dryRun?: true | undefined
  keepScripts?: true | undefined
}
export async function exportHandler({ workspaceDir, output, dryRun, scriptCwd, keepScripts }: ExportOptions) {
  const { workspace, model, viewSourcePaths } = await initLanguageServices({ workspaceDir })

  const modelViews = values(model.views)

  if (modelViews.length === 0) {
    console.error(red(' ⛔️  No views found'))
    process.exit(1)
  }

  console.log(dim(`🔍 Layout views...`))

  const diagrams = map(await layoutViews(values(model.views)), d => {
    const sourcePath = viewSourcePaths[d.id]
    if (!sourcePath) {
      throw new Error(`No source path for view ${d.id}`)
    }
    return addProp(d, 'sourcePath', sourcePath)
  })

  console.log(green('✅ LikeC4 parsed\n\n'))

  const outputdir = output ? resolve(process.cwd(), output) : workspace

  let cwd = scriptCwd ? resolveDir(scriptCwd === true ? '.' : scriptCwd) : null
  if (cwd === null) {
    console.log(green(`Prepare temporary node project...`))
    cwd = await createProject(dryRun)
  }

  await mkdirp(outputdir)

  let puppeteerPage = await readFile(resolve(__dirname, 'puppeteer-page.js'), 'utf-8')
  puppeteerPage += '\n\n' + generateViewsData(diagrams)

  const puppeteerPageJS = join(cwd, 'puppeteer-page.js')
  const exportJS = join(cwd, 'puppeteer-script.js')

  await Promise.all([
    writeFile(puppeteerPageJS, puppeteerPage),
    writeFile(exportJS, generateExportScript(diagrams, puppeteerPageJS, outputdir))
  ])
  console.log(`Puppeteer scripts:`)
  console.log(`  ${puppeteerPageJS}`)
  console.log(`  ${exportJS}\n\n`)

  console.log('🎨 ' + green('Run export script...'))
  if (cwd !== process.cwd()) {
    console.log(dim(`  $ `) + yellow(`cd ${cwd}`))
  }
  console.log(dim(`  $ `) + yellow('node puppeteer-script.js\n\n'))

  if (dryRun === true) {
    console.log(dim('dry run, skipping...'))
  } else {
    await execa('node', ['puppeteer-script.js'], {
      cwd,
      stdio: 'inherit'
    })
  }

  if (keepScripts !== true) {
    console.log('🗑️ ' + dim('remove scripts...'))
    await Promise.allSettled([rm(puppeteerPageJS, { force: true }), rm(exportJS, { force: true })])
  } else {
    console.log(green(`\n\ngenerated scripts:`))
    console.log(yellow(`  ${puppeteerPageJS}`))
    console.log(yellow(`  ${exportJS}`))
  }

  console.log('\n' + green('✅ Done'))
}

export const exportCommand = () => {
  return createCommand('export')
    .summary('export likec4 views to png')
    .description(`Export LikeC4 views to PNG, rendering in Headless Chrome with Puppeteer`)
    .addArgument(
      createArgument('workspace', 'where to search for likec4 sources')
        .argOptional()
        .default(process.cwd(), 'current directory')
    )
    .option('-o, --output <directory>', 'directory to output generated png\n(default: workspace next to sources)')
    .addOption(
      createOption('-S, --script-cwd [path]', 'path to run export scripts\nif not defined, creates temporary folder')
    )
    .option('--keep-scripts', 'do not delete generated scripts')
    .addOption(
      createOption('--dry-run', 'generate, but do not run export scripts').implies({
        keepScripts: true
      })
    )
    .action(async (workspaceDir, opts) => {
      return await exportHandler({ workspaceDir, ...opts })
    })
}
