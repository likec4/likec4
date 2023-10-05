#!/usr/bin/env node

import { program } from '@commander-js/extra-typings'
import { codegenCommand } from './cmd-codegen'
import { exportCommand } from './cmd-export'

program
  .name('likec4')
  .enablePositionalOptions()
  .addCommand(codegenCommand().passThroughOptions())
  .addCommand(exportCommand())

program.parse()
