import { existsSync, readdirSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { cwd } from 'node:process'
import { chalk } from 'zx'

/**
 * Clean a directory by removing all files and subdirectories
 * (but not the directory itself)
 *
 * @param dir - The directory to clean
 */
export async function cleanDir(dir: string) {
  if (!isAbsolute(dir)) {
    dir = resolve(cwd(), dir)
  }
  if (!existsSync(dir)) {
    return
  }
  const inside = readdirSync(dir)
  if (inside.length === 0) {
    return
  }
  console.log(chalk.dim('🧽 cleaning') + ` ${dir}`)
  console.log(chalk.dim('   └─ remove') + ` ${inside.length} ` + chalk.dim('items'))
  for (const file of inside) {
    await rm(resolve(dir, file), { recursive: true, force: true })
  }
}
