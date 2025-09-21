import { defineCommand } from 'citty'
import { resolve } from 'node:path'
import { $, chalk, echo, fs, path } from 'zx'
import { loadPrepackGitignore } from './prepack.ts'

export default defineCommand({
  meta: {
    name: 'clean',
    description: 'Clean workspace',
  },
  args: {
    // cwd: {
    //   type: 'string',
    //   description: 'change working directory',
    //   required: false,
    // },
  },
  async run({ args }) {
    process.env.FORCE_COLOR = '1'

    $.preferLocal = true
    $.verbose = true
    $.cwd = process.cwd()

    echo(chalk.green('⚙️ cleaning workspace...'))

    const toclean = [
      'lib',
      'dist',
      '.wire',
      '.turbo',
      'node_modules/.cache',
      'node_modules/.vite',
      'tsconfig.tsbuildinfo',
      ...args._,
    ]

    for (const subj of toclean) {
      const path = resolve($.cwd, subj)
      if (fs.existsSync(path)) {
        echo(`${chalk.gray('rm')} ${chalk.dim(subj)}`)
        await fs.rm(path, { recursive: true, force: true })
      }
    }

    // Clean tgz
    for (const file of fs.readdirSync($.cwd)) {
      if (file.endsWith('.tgz')) {
        echo(`${chalk.gray('rm')} ${chalk.dim(file)}`)
        await fs.rm(file, { force: true })
      }
    }

    const { prepackIgnored } = await loadPrepackGitignore()
    if (prepackIgnored.length === 0) {
      echo(chalk.green('✅ done'))
      return
    }
    echo('')
    echo(chalk.green('⚙️ Clean from prepack...'))

    for (const subj of prepackIgnored) {
      try {
        if (fs.existsSync(subj)) {
          echo(`${chalk.gray('  rm ignored:')} ${chalk.dim(subj)}`)
          await fs.rm(subj, { force: true })
        }

        // Check if the directory is empty
        const dir = path.dirname(subj)
        if (!fs.existsSync(dir)) {
          continue
        }
        if (fs.readdirSync(dir).length === 0) {
          echo(`${chalk.gray('  rm empty dir:')} ${chalk.dim(dir)}`)
          await fs.rm(dir, { recursive: true, force: true })
        }
      } catch (e) {
        console.error(e)
        // ignore
      }
    }

    echo(chalk.green('✅ done'))
  },
})
