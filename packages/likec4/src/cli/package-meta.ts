/**
 * Package name and version at runtime. Uses the same pattern as leanix-bridge/contracts.ts:
 * createRequire(import.meta.url) + path relative to the running module, so it works when
 * the CLI is installed from a tarball (e.g. e2e). The CLI is bundled as dist/cli/index.mjs,
 * so we resolve two levels up from dist/cli/ to reach the package root.
 */
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_JSON_FILENAME = 'package.json'

/** Shape we read from package.json (name and version only). */
interface PackageMeta {
  name: string
  version: string
}

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
// Two levels up: dist/cli/ -> dist/ -> package root (see file JSDoc).
const packageJsonPath = join(__dirname, '..', '..', PACKAGE_JSON_FILENAME)
const packageManifest = require(packageJsonPath) as PackageMeta

export const name = packageManifest.name
/** Single source of truth: must match package.json version. */
export const version = packageManifest.version
