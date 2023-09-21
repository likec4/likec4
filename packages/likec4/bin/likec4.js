#!/usr/bin/env node

/* eslint-disable  */

function start() {
  // @ts-ignore
  return import('../dist/cli/index.js')
}
start()
