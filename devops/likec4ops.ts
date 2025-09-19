#!/usr/bin/env -S pnpm tsx

import { defineCommand, runMain } from 'citty'
import clean from './commands/clean.ts'
import exportSubmodules from './commands/export-submodules.ts'

const main = defineCommand({
  meta: {
    name: 'likec4ops',
    description: 'LikeC4 Ops CLI',
  },
  // setup() {
  //   console.log('Setup')
  // },
  // cleanup() {
  //   console.log('Cleanup')
  // },
  subCommands: {
    clean,
    'export-submodules': exportSubmodules,
  },
})

runMain(main)
