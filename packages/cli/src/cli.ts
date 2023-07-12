#!/usr/bin/env node

import { createCommand } from '@commander-js/extra-typings'
import { codegenCommand } from './cmd-codegen'
import { exportCommand } from './cmd-export'
import { version } from '../package.json'

const program = createCommand()
  .version(version)
  .addCommand(codegenCommand())
  .addCommand(exportCommand())

program.parse()
