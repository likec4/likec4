import { existsSync, writeFileSync } from 'node:fs'
import { platform } from 'node:os'
import { $ as _$, quotePowerShell, usePowerShell } from 'zx'

const isWindows = platform() === 'win32'
// On Windows, zx needs PowerShell (no bash by default in v8+)
if (isWindows) {
  usePowerShell()
}
const $ = _$({
  stdio: 'inherit',
  preferLocal: true,
  ...(isWindows ? { quote: quotePowerShell } : {}),
})

await $`tsr generate`

const envTemplate = `
OAUTH_GITHUB_ID=""
OAUTH_GITHUB_SECRET=""
SESSION_ENCRYPTION_KEY="VFRAdSem81cuALVeOMC4PJyLXf30tckV"
`

if (!existsSync('.env')) {
  writeFileSync(
    '.env',
    envTemplate,
  )
}
if (!existsSync('.dev.vars')) {
  writeFileSync(
    '.dev.vars',
    envTemplate,
  )
}

await $`wrangler types`
