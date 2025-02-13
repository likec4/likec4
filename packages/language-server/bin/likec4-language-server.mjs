#!/usr/bin/env node

import { startLanguageServer } from '../dist/bin.mjs'

startLanguageServer().catch((e) => {
  console.error(e)
  process.exit(1)
})
