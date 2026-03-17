/**
 * Package name and version at runtime. Path is resolved from the running module so it works
 * when the CLI is installed from a tarball (e2e). The CLI is bundled as dist/cli/index.mjs,
 * so we resolve two levels up from dist/cli/ to reach the package root.
 * Uses readFileSync + JSON.parse (not require) so the bundler does not emit a static
 * require('../package.json') that fails at runtime in the tarball layout.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_JSON_FILENAME = 'package.json'

/** Shape we read from package.json (name and version only). */
interface PackageMeta {
  name: string
  version: string
}

const __dirname = dirname(fileURLToPath(import.meta.url))
// Two levels up: dist/cli/ -> dist/ -> package root (see file JSDoc).
const packageJsonPath = join(__dirname, '..', '..', PACKAGE_JSON_FILENAME)
const packageManifest = JSON.parse(
  readFileSync(packageJsonPath, 'utf8'),
) as PackageMeta

export const name = packageManifest.name
/** Single source of truth: must match package.json version. */
export const version = packageManifest.version
