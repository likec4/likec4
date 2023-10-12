import path, { resolve } from 'node:path'
import { $ } from 'execa'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'

export const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const __root = resolve(__dirname, '..')

export const $$ = $({
  shell: true,
  cwd: __root
})

export function exists(path: string) {
  return existsSync(resolve(__root, path))
}

export function readFile(path: string) {
  return readFileSync(resolve(__root, path), 'utf-8')
}
