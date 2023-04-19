import { generateReact, generateViewsDataTs } from '@likec4/generators'
import { dotLayouter } from '@likec4/layouts'
import chalk from 'chalk'
import type { Command } from 'commander'
import mkdirp from 'mkdirp'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { mapParallelAsyncWithLimit, values } from 'rambdax'
import { initLanguageServices } from './language-services'

async function generateAction(
  workspaceDir: string,
  { target, output }: { output?: string; target?: string }
) {
  let extension
  let generator
  if (target === 'react') {
    extension = '.tsx'
    generator = generateReact
  } else if (target === 'views-data') {
    extension = '.ts'
    generator = generateViewsDataTs
  } else {
    console.error(chalk.red(`Unknown target: ${target}`))
    process.exit(1)
  }

  const { workspace, model } = await initLanguageServices({ workspaceDir })

  console.log(chalk.dim`🔍 Layouting...`)

  const layout = await dotLayouter()
  const diagrams = await mapParallelAsyncWithLimit(layout, 2, values(model.views))

  const generated = generator(diagrams)

  output = output
    ? path.resolve(process.cwd(), output)
    : path.resolve(workspace, `likec4.generated${extension}`)

  await mkdirp(path.dirname(output))
  const extname = path.extname(output)
  if (extname !== extension) {
    output = output.substring(0, output.length - extname.length) + extension
  }
  await writeFile(output, generated)
  console.log('\nGenerated:\n   ' + chalk.green(output))
}

export const registerGenerateCommand = (program: Command): void => {
  program
    .command('generate')
    .description('generate react components or typed views data')
    .argument('[workspace]', 'directory with likec4 sources', process.cwd())
    .option('-t, --target [target]', 'possible values: react, views-data', 'react')
    .option('-o, --output [output]', 'output file')
    .action(generateAction)
}
