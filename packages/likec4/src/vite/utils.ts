import consola from 'consola'
import { existsSync } from 'node:fs'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const _dirname = dirname(fileURLToPath(import.meta.url))

const banner = `
// @ts-nocheck
/* prettier-ignore-start */
/* eslint-disable */

/******************************************************************************
 * This file was generated
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

`.trimStart()

const footer = `

/* prettier-ignore-end */
`

export const JsBanners = {
  banner,
  footer
}

export function viteAppRoot() {
  const root = resolve(_dirname, '../__app__')
  if (!existsSync(root)) {
    consola.error(`likec4 app root does not exist: ${root}`)
    throw new Error(`likec4 app root does not exist: ${root}`)
  }
  return root
}

export async function mkTempPublicDir() {
  const publicDir = await mkdtemp(join(tmpdir(), '.likec4-public-'))
  await writeFile(join(publicDir, 'likec4-views.js'), '// generated by likec4\n')
  return publicDir
}

/**
 * Adjust chunk size warning limit (in kB).
 */
export const chunkSizeWarningLimit = 10_000
