import { existsSync } from 'node:fs'
import { cp, mkdir } from 'node:fs/promises'
import { resolve } from 'path'
import { emptyDir } from './_utils'

async function bundleApp() {
  const likec4Spa = resolve('../likec4-spa/dist/')
  if (!existsSync(likec4Spa)) {
    throw new Error(`likec4 spa not found: ${likec4Spa}`)
  }
  emptyDir('__app__')
  await mkdir('__app__', { recursive: true })
  console.info('Copy likec4 spa from %s', likec4Spa)
  await cp(
    likec4Spa,
    '__app__',
    {
      recursive: true,
      force: true,
    },
  )
}

await bundleApp()
