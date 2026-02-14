#!/usr/bin/env -S pnpm tsx

import { defineCommand, runMain } from 'citty'
import clean from './commands/clean.ts'
import prepack from './commands/prepack.ts'
import syncVersion from './commands/sync-version.ts'

const main = defineCommand({
  meta: {
    name: 'likec4ops',
    description: 'LikeC4 Ops CLI',
  },
  setup() {
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection reason:', reason)
      process.exit(1)
    })
  },
  // cleanup() {
  //   console.log('Cleanup')
  // },
  subCommands: {
    clean,
    prepack,
    'sync-version': syncVersion,
  },
})

void runMain(main)
