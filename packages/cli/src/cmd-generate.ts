import type { Command } from 'commander'
import { initLanguageServices } from './language-services'
import { dotLayouter } from '@likec4/layouts'
import { generateReact } from '@likec4/generators/react'
import { mapParallelAsyncWithLimit, values } from 'rambdax'
import path from 'node:path'
import mkdirp from 'mkdirp'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import chalk from 'chalk'



async function generateAction(workspaceDir: string, {output}: { output: string }) {
  const { workspace, model } = await initLanguageServices({ workspaceDir })
  const layout = await dotLayouter()
  const diagrams = await mapParallelAsyncWithLimit(layout, 2, values(model.views))

  const reactOutput = generateReact(diagrams)

  if (!path.isAbsolute(output)) {
    output = path.resolve(workspace, output)
  }
  if (!existsSync(output)) {
    await mkdirp(path.dirname(output))
  }
  await writeFile(output, reactOutput)
  console.log('\nGenerated:\n   ' + chalk.green(output))
}


export const registerGenerateCommand = (program: Command): void => {
  program
    .command('generate-react')
    .description('generate react components for views (TypeScript)')
    .argument('[workspace]', 'directory with sources', process.cwd())
    .option('-o, --output [output]', 'output file', './src/componets/likec4.tsx')
    .action(generateAction)
}
