import { consola } from 'consola'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { emptyDir } from './_utils'

emptyDir(resolve('react'))
emptyDir(resolve('dist'))

await mkdir('dist/__app__/src', { recursive: true })
