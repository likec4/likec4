/* eslint-disable */
import { $ } from 'execa'
import { rm } from 'fs/promises'
import { resolve } from 'path'

const __dirname = new URL('.', import.meta.url).pathname

const $$ = $({
  stdio: 'inherit',
  cwd: resolve(__dirname, '..', '..'),
});

await rm(resolve(__dirname, 'out'), { recursive: true, force: true })

const out = './integration/like4-cli-tests/out'
const workspace = './integration/like4-cli-tests/likec4'

await $$`packages/cli/bin/likec4 codegen react -o ${out}/react.tsx ${workspace}`;

await $$`packages/cli/bin/likec4 export --dry-run --script-cwd ${out} -o ${out} ${workspace}`;
