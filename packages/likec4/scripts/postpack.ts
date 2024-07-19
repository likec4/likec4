import { rm } from 'node:fs/promises'

await rm('react/', { recursive: true, force: true })
await rm('icons/', { recursive: true, force: true })
