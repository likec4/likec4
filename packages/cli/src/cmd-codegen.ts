import { createArgument, createCommand } from '@commander-js/extra-typings'
import type { DiagramView } from '@likec4/core'
import { generateReact, generateViewsDataTs, generateD2 } from '@likec4/generators'
import { printToDot } from '@likec4/layouts'
import { red, green, dim } from 'kleur/colors'
import { mkdirp } from 'mkdirp'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { values } from 'rambdax'
import { initLanguageServices, layoutViews } from './language-services'

async function codegenAction(
  generator: (views: DiagramView[]) => string,
  workspaceDir: string,
  extension: '.tsx' | '.ts',
  output?: string
) {
  const { workspace, model } = await initLanguageServices({ workspaceDir })

  console.log(dim(`🔍\tLayouting...`))

  const diagrams = await layoutViews(values(model.views))

  const generated = generator(diagrams)

  output = output ? path.resolve(process.cwd(), output) : path.resolve(workspace, `likec4.generated${extension}`)

  await mkdirp(path.dirname(output))
  const extname = path.extname(output)
  if (extname !== extension) {
    output = output.substring(0, output.length - extname.length) + extension
  }
  await writeFile(output, generated)
  console.log('\nGenerated:\n   ' + green(path.relative(process.cwd(), output)))
}

async function codegenDotAction(workspaceDir: string, outputdir?: string) {
  const { workspace, model } = await initLanguageServices({ workspaceDir })
  const diagrams = values(model.views)
  if (diagrams.length === 0) {
    console.log(red(`No views found`))
    process.exit(1)
  }

  outputdir = outputdir ? path.resolve(process.cwd(), outputdir) : workspace

  await mkdirp(outputdir)

  console.log(green('\nGenerated:'))
  for (const diagram of diagrams) {
    const generated = printToDot(diagram)
    const output = path.resolve(outputdir, diagram.id + '.dot')
    await writeFile(output, generated)
    console.log(' - ' + green(path.relative(process.cwd(), output)))
  }
}

async function codegenD2Action(workspaceDir: string, outputdir?: string) {
  const { workspace, model } = await initLanguageServices({ workspaceDir })
  console.log(dim(`🔍\tLayouting...`))

  // const layout = await dotLayouter()
  // const diagrams = await mapAsync(layout, values(model.views))
  const diagrams = await layoutViews(values(model.views))

  if (diagrams.length === 0) {
    console.log(red(`No views found`))
    process.exit(1)
  }

  outputdir = outputdir ? path.resolve(process.cwd(), outputdir) : workspace

  await mkdirp(outputdir)

  console.log(green('\nGenerated:'))
  for (const diagram of diagrams) {
    const generated = generateD2(diagram)
    const output = path.resolve(outputdir, diagram.id + '.d2')
    await writeFile(output, generated)
    console.log(' - ' + green(path.relative(process.cwd(), output)))
  }
}

export const codegenCommand = () => {
  return createCommand('codegen')
    .summary('code-generator')
    .description('Generate various artifacts from LikeC4 sources')
    .addCommand(
      createCommand('react')
        .summary('generates react components')
        .description('generates react components to render likec4 views')
        .addArgument(
          createArgument('workspace', 'directory with likec4 sources').argOptional().default(process.cwd(), '"."')
        )
        .option('-o, --output <file>', 'output .tsx file\nif not defined, outputs to workspace')
        .action((sourcedir, { output }) => codegenAction(generateReact, sourcedir, '.tsx', output))
    )
    .addCommand(
      createCommand('views-data')
        .summary('dumps views data')
        .description('generates ts file with computed data of likec4 views')
        .addArgument(
          createArgument('workspace', 'directory with likec4 sources').argOptional().default(process.cwd(), '"."')
        )
        .option('-o, --output <file>', 'output .ts file\nif not defined, outputs to workspace')
        .action((sourcedir, { output }) => codegenAction(generateViewsDataTs, sourcedir, '.ts', output))
    )
    .addCommand(
      createCommand('dot')
        .summary('generates graphviz dot files')
        .description('generates graphviz dot files for each likec4 view')
        .addArgument(
          createArgument('workspace', 'directory with likec4 sources').argOptional().default(process.cwd(), '"."')
        )
        .option('-o, --output <directory>', 'output directory\nif not defined, outputs to workspace')
        .action((sourcedir, { output }) => codegenDotAction(sourcedir, output))
    )
    .addCommand(
      createCommand('d2')
        .summary('generates d2 files')
        .description('generates d2 files for each likec4 view')
        .addArgument(
          createArgument('workspace', 'directory with likec4 sources').argOptional().default(process.cwd(), '"."')
        )
        .option('-o, --output <directory>', 'output directory\nif not defined, outputs to workspace')
        .action((sourcedir, { output }) => codegenD2Action(sourcedir, output))
    )
    .addHelpText(
      'afterAll',
      `
Examples:
  likec4 codegen react -o ./src/likec4.generated.tsx ./src/likec4
  likec4 codegen views-data -o ./src/likec4-data.ts
  likec4 codegen dot
`
    )
}
