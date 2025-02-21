#!/usr/bin/env node

import { startLanguageServer } from '.../dist/bundled.mjs'

startLanguageServer().catch((e) => {
  console.error(e)
  process.exit(1)
})
