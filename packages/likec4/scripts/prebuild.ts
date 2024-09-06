import { consola } from 'consola'
import { $, execa } from 'execa'
import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { stderr } from 'node:process'

const dist = resolve('./dist')

consola.info('Cleaning dist: %s', dist)
await rm(dist, { recursive: true, force: true })
await mkdir('dist/__app__/src', { recursive: true })
