import { Command } from 'commander'
import { registerGenerateCommand } from './cmd-generate'

const program = new Command()
registerGenerateCommand(program)
program.parse(process.argv)
