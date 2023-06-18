import { createCommand } from '@commander-js/extra-typings'
import { codegenCommand } from './cmd-codegen'
import { exportCommand } from './cmd-export'

const program = createCommand()
  .addCommand(codegenCommand())
  .addCommand(exportCommand())

program.parse()
