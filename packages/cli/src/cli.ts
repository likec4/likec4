import { createCommand } from '@commander-js/extra-typings'
import { codegenCommand } from './cmd-codegen'

const program = createCommand()
  .addCommand(codegenCommand())
void program.parseAsync()
