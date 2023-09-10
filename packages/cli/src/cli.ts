#!/usr/bin/env node

import { program } from '@commander-js/extra-typings'
import { codegenCommand } from './cmd-codegen'
import { exportCommand } from './cmd-export'
import { version } from '../package.json'

program
  .name('likec4')
  .version(version)
  .enablePositionalOptions()
  .addCommand(codegenCommand().passThroughOptions())
  .addCommand(exportCommand())

program.parse()
