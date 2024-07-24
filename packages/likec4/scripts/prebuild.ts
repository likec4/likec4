import { mkdir, rm } from 'node:fs/promises'

await rm('dist/__app__', { recursive: true, force: true })
await mkdir('dist/__app__/src', { recursive: true })
