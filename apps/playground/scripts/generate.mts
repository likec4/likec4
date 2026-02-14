import { existsSync, writeFileSync } from 'node:fs'
import { $ as _$ } from 'zx'

const $ = _$({ stdio: 'inherit', preferLocal: true })

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
