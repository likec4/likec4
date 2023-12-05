import { dirname, relative } from 'path'
import { fileURLToPath } from 'url'
import { defineProject } from 'vitest/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const root = './' + relative(process.cwd(), __dirname)

// console.log('__filename', __filename)
// console.log('__dirname', __dirname)
console.log('root', root)

export default defineProject({
  test: {
    root,
    name: 'core',
    chaiConfig: {
      truncateThreshold: 300
    }
  }
})
