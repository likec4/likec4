import { createArgument, createCommand } from '@commander-js/extra-typings'
import { dotLayouter } from '@likec4/layouts'
import chalk from 'chalk'
import { execa } from 'execa'
import { mkdirp } from 'mkdirp'
import { copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path/posix'
import { mapAsync, values } from 'rambdax'
import { generateExportScript, generateViewsData } from './export'
import { initLanguageServices } from './language-services'

async function createProject() {
  const dir = await mkdtemp(join(tmpdir(), 'likec4-'))

  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: 'likec4-export',
        version: '1.0.0',
        private: true,
        scripts: {
          start: 'node export.js'
        },
        engines: {
          "node": ">=16"
        },
        engineStrict: true,
        dependencies: {
          puppeteer: '20.5.0'
        }
      },
      null,
      2
    )
  )

  await execa('npm', ['install', '--no-audit', '--no-fund'], {
    cwd: dir,
    env: {
      'NODE_ENV': 'production'
    },
    stdio: 'inherit'
  })

  return dir
}

export const exportCommand = () => {
  return createCommand('export')
    .summary('export views to png')
    .description('export likec4 views to png')
    .addArgument(
      createArgument('sourcedir', 'directory with likec4 sources')
        .argOptional()
        .default(process.cwd(), '"."')
    )
    .option('-o, --output <directory>', 'output directory')
    .action(async (workspaceDir, { output }) => {
      const { workspace, model } = await initLanguageServices({ workspaceDir })

      const modelViews = values(model.views)

      if (modelViews.length === 0) {
        console.error(chalk.red(' ⛔️  No views found'))
        process.exit(1)
      }

      console.log(chalk.dim`🔍 Layouting...`)

      const layout = await dotLayouter()
      const diagrams = await mapAsync(layout, modelViews)

      console.log(chalk.green('✅ LikeC4 parsed'))

      console.log('')

      console.log(chalk.green(`Prepare temporary node project...`))
      const dir = await createProject()
      console.log('  ' + chalk.dim(dir))

      try {
        const outputdir = output ? resolve(process.cwd(), output) : workspace

        await mkdirp(outputdir)

        await copyFile(join(__dirname, 'puppeteer-page.js'), join(dir, 'puppeteer-page.js'))
        await writeFile(join(dir, 'likec4views.js'), generateViewsData(diagrams))
        await writeFile(join(dir, 'export.js'), generateExportScript(diagrams, outputdir))

        console.log('')
        console.log('🏋️‍♀️ ' + chalk.green('Run export script...'))
        console.log('  ' + chalk.dim('cwd: ' + dir))
        console.log('  ' + chalk.dim('node export.js'))
        console.log('')

        await execa('node', ['export.js'], {
          cwd: dir,
          stdio: 'inherit'
        })
      } finally {
        console.log('')
        console.log(chalk.dim('Cleaning up...'))
        console.log('  ' + chalk.dim(dir))
        await rm(dir, { recursive: true, force: true })
      }

      console.log('\n' + chalk.green('✅ Done'))
    })
}
