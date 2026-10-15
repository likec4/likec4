import { defineCommand } from 'citty'
import { partition } from 'remeda'
import { chalk, echo, fs, globby } from 'zx'

export default defineCommand({
  meta: {
    name: 'rm',
    description: 'Remove files/directories by glob pattern',
  },
  args: {
    pattern: {
      type: 'positional',
      description: 'Glob pattern to matc',
      // required: true,
    },
  },
  async run({ args, rawArgs }) {
    process.env.FORCE_COLOR = '1'
    const [globs, paths] = partition(
      rawArgs,
      (pattern) => pattern.includes('*') || pattern.includes('?') || pattern.includes('**'),
    )

    if (paths.length > 0) {
      echo(chalk.green('\n⚙️ removing by paths...\n'))
      for (const path of paths) {
        const exists = await fs.pathExists(path)
        if (!exists) {
          echo(`${chalk.grey(' skip    ')} ${chalk.dim(path)}`)
          continue
        }
        try {
          if (path.endsWith('/')) {
            await fs.emptyDir(path)
            echo(`${chalk.grey(' emptied ')} ${path}`)
          } else {
            await fs.rm(path, { recursive: true, force: true })
            echo(`${chalk.grey(' removed ')} ${path}`)
          }
        } catch (error) {
          echo(`${chalk.red('error')} ${path}: ${error}`)
        }
      }
    }

    if (globs.length > 0) {
      const files = await globby(globs, {
        markDirectories: true,
        onlyFiles: false,
        objectMode: true,
      })
      if (files.length === 0) {
        echo(chalk.grey('no files found by patterns: '))
        for (const pattern of globs) {
          echo(chalk.dim(` ↳ `) + pattern)
        }
        return
      }
      echo(chalk.green('\n⚙️ removing by globs...\n'))
      for (const entry of files) {
        try {
          if (entry.dirent.isDirectory()) {
            echo(`${chalk.dim(' rm ')}${chalk.grey('dir ')} ${entry.path}`)
          } else {
            echo(`${chalk.dim(' rm ')}${chalk.grey('file')} ${entry.path}`)
          }
          await fs.rm(entry.path, { recursive: true, force: true })
        } catch (error) {
          echo(`${chalk.red('error')} ${entry.path}: ${error}`)
        }
      }
    }
    echo(chalk.green('\n✅ done'))
  },
})
