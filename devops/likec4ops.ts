#!/usr/bin/env node

import { defineCommand, runMain } from 'citty'

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
    clean: () => import('./commands/clean.ts').then((m) => m.default),
    postpack: () => import('./commands/postpack.ts').then((m) => m.default),
    prepack: () => import('./commands/prepack.ts').then((m) => m.default),
    'sync-version': () => import('./commands/sync-version.ts').then((m) => m.default),
    rm: () => import('./commands/rm.ts').then((m) => m.default),
  },
})

void runMain(main)
