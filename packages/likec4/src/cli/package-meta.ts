/**
 * Package name and version at runtime. Path is resolved from the running module so the CLI
 * works when installed from a tarball (e2e). Uses readFileSync so the bundler does not emit
 * a static require that fails in the tarball layout. CLI bundle is at dist/cli/index.mjs →
 * two levels up to package root.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = join(__dirname, '..', '..', 'package.json')
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name: string; version: string }

/** CLI package name at runtime (from package.json). */
export const name = pkg.name
/** CLI package version at runtime (from package.json). */
export const version = pkg.version
