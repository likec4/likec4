import { createArgument, createCommand, createOption } from '@commander-js/extra-typings'
import chalk from 'chalk'
import { execa } from 'execa'
import { mkdirp } from 'mkdirp'
import { existsSync } from 'node:fs'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path/posix'
import { values } from 'rambdax'
import { addProp, map } from 'remeda'
import { generateExportScript, generateViewsData } from './export'
import { initLanguageServices, layoutViews, resolveDir } from './language-services'

async function createProject() {
  const dir = join(tmpdir(), 'likec4-export')

  const packageLock = join(dir, 'package-lock.json')
  if (existsSync(packageLock)) {
    console.log(chalk.green('exists:') + ' ' + packageLock)
    return dir
  }

  console.log('  ' + chalk.dim('mkdir: ' + dir))

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
          puppeteer: '^20.5.0'
        }
      },
      null,
      2
    )
  )

  await execa('npm', ['install', '--no-audit'], {
    cwd: dir,
    env: {
      NODE_ENV: 'production'
    },
    stdio: 'inherit'
  })

  return dir
}

export const exportCommand = () => {
  return createCommand('export')
    .summary('export views to png')
    .description(`Export LikeC4 views to PNG, rendering in Headless Chrome`)
    .addArgument(
      createArgument('workspace', 'directory with likec4 sources')
        .argOptional()
        .default(process.cwd(), '"."')
    )
    .option('-o, --output <directory>', 'output directory\nif not defined, outputs to workspace')
    .addOption(
      createOption(
        '-S, --script-cwd [path]',
        'use current folder or path to run export scripts in.\nExpects npm project with puppeteer installed.\nIf not defined, generates temporary one and installs puppeteer.'
      )
        .env('LIKEC4_SCRIPT_CWD')
    )
    .action(
      async (workspaceDir, { output, scriptCwd }) => {
        const { workspace, model, viewSourcePaths } = await initLanguageServices({ workspaceDir })

        const modelViews = values(model.views)

        if (modelViews.length === 0) {
          console.error(chalk.red(' ⛔️  No views found'))
          process.exit(1)
        }

        console.log(chalk.dim`🔍 Layouting...`)

        const diagrams = map(await layoutViews(values(model.views)), d => {
          const sourcePath = viewSourcePaths[d.id]
          if (!sourcePath) {
            throw new Error(`No source path for view ${d.id}`)
          }
          return addProp(d, 'sourcePath', sourcePath)
        })

        console.log(chalk.green('✅ LikeC4 parsed'))

        console.log('')

        const outputdir = output ? resolve(process.cwd(), output) : workspace

        let cwd = scriptCwd ? resolveDir(scriptCwd === true ? '.' : scriptCwd) : null
        if (cwd === null) {
          console.log(chalk.green(`Prepare temporary node project...`))
          cwd = await createProject()
        } else {
          console.log(chalk.dim(`Skip temporary node project...`))
        }
        console.log('  ' + chalk.dim('scripts cwd: ' + cwd))

        await mkdirp(outputdir)

        let puppeteerPage = await readFile(join(__dirname, 'puppeteer-page.js'), 'utf-8')
        puppeteerPage += '\n\n' + generateViewsData(diagrams)

        const puppeteerPageJS = join(cwd, 'puppeteer-page.js')
        const exportJS = join(cwd, 'puppeteer-script.js')

        await Promise.all([
          writeFile(puppeteerPageJS, puppeteerPage),
          writeFile(exportJS, generateExportScript(diagrams, outputdir))
        ])
        console.log(`puppeteer page: ${puppeteerPageJS}`)
        console.log(`puppeteer script: ${exportJS}`)

        console.log('')

        console.log('🎨 ' + chalk.green('Run export script...'))
        console.log('  ' + chalk.dim('node puppeteer-script.js'))
        console.log('')

        await execa('node', ['puppeteer-script.js'], {
          cwd,
          stdio: 'inherit'
        })

          console.log('🗑️ ' + chalk.dim('remove scripts...'))
          await Promise.allSettled([
            rm(puppeteerPageJS, { force: true }),
            rm(exportJS, { force: true })
          ])

        console.log('\n' + chalk.green('✅ Done'))
      }
    )
}
