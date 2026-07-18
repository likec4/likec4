import { isAbsolute, resolve } from 'node:path'
import { cwd } from 'node:process'
import { chalk, fs } from 'zx'

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
  if (!fs.existsSync(dir)) {
    return
  }
  const inside = fs.readdirSync(dir)
  if (inside.length === 0) {
    return
  }
  console.log(chalk.dim('🧽 cleaning') + ` ${dir}`)
  console.log(chalk.dim('   └─ remove') + ` ${inside.length} ` + chalk.dim('items'))
  await fs.emptyDir(dir)
  // for (const file of inside) {
  //   await rm(resolve(dir, file), { recursive: true, force: true })
  // }
}
