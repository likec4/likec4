import { defineCommand } from 'citty'
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Cross-platform postpack: copy the packed tgz to package.tgz (for e2e/CI).
 * Replaces `cp <name>-<version>.tgz package.tgz || true` so it works on Windows.
 */
export default defineCommand({
  meta: {
    name: 'postpack',
    description: 'Copy packed tgz to package.tgz (cross-platform)',
  },
  async run() {
    const cwd = process.cwd()
    const pkgPath = resolve(cwd, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { name: string; version: string }
    const base = pkg.name.replace('@', '').replace(/\//g, '-')
    const tgz = `${base}-${pkg.version}.tgz`
    const src = resolve(cwd, tgz)
    const dest = resolve(cwd, 'package.tgz')
    if (existsSync(src)) {
      copyFileSync(src, dest)
    }
  },
})
