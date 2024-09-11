import consola from 'consola'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { argv } from 'node:process'

export function amIExecuted(filename: string) {
  return argv.some(arg => arg.includes(filename))
}

export function emptyDir(dir: string) {
  if (!existsSync(dir)) {
    return
  }
  consola.info('Cleaning: %s', dir)
  for (const file of readdirSync(dir)) {
    rmSync(resolve(dir, file), { recursive: true, force: true })
  }
}
