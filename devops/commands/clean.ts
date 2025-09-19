import { defineCommand } from 'citty'
import { resolve } from 'node:path'
import { $, chalk, echo, fs } from 'zx'

export default defineCommand({
  meta: {
    name: 'clean',
    description: 'Clean workspace',
  },
  args: {
    cwd: {
      type: 'string',
      description: 'change working directory',
      required: false,
    },
  },
  async run({ args }) {
    process.env.FORCE_COLOR = '1'
    $.preferLocal = true
    $.verbose = true

    echo(chalk.green('⚙️ cleaning workspace...'))

    if (args.cwd && args.cwd !== '.') {
      $.cwd = resolve('.', args.cwd)
    } else {
      $.cwd = resolve('.')
    }
    echo(`${chalk.gray('cwd')} ${$.cwd}`)

    const toclean = [
      'lib',
      'dist',
      '.wire',
      '.turbo',
      'node_modules/.cache',
      'node_modules/.vite',
      'tsconfig.tsbuildinfo',
    ]

    for (const subj of toclean) {
      const path = resolve($.cwd, subj)
      if (fs.existsSync(path)) {
        echo(`${chalk.gray('rm')} ${subj}`)
        await fs.rm(path, { recursive: true, force: true })
      }
    }

    echo(chalk.green('✅ done'))
  },
})
