import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'path'
import { amIExecuted } from './_utils'

import { existsSync, readdirSync } from 'node:fs'
import { $, fs } from 'zx'

$.verbose = true

async function emptyDir(dir: string) {
  if (!existsSync(dir)) {
    return
  }
  console.info('Cleaning: %s', dir)
  for (const file of readdirSync(dir)) {
    await rm(resolve(dir, file), { recursive: true, force: true })
  }
}

export async function bundleApp() {
  const likec4Spa = resolve('../likec4-spa/dist/')
  if (!existsSync(likec4Spa)) {
    throw new Error(`likec4 spa not found: ${likec4Spa}`)
  }
  console.info('Copy likec4 spa from %s', likec4Spa)

  await emptyDir('__app__')
  await mkdir('__app__', { recursive: true })
  fs.cpSync(
    likec4Spa,
    '__app__',
    {
      recursive: true,
      force: true,
    },
  )
}

if (amIExecuted(import.meta.filename)) {
  console.info('Running as script')
  await bundleApp()
}
