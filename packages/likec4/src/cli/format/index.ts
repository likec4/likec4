import { fromWorkspace } from '@likec4/language-services/node/without-mcp'
import { readFile, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { createLikeC4Logger, startTimer } from '../../logger'
import { path } from '../options'

const formatCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'format [path]',
      aliases: ['fmt'],
      describe: 'Format LikeC4 source files',
      builder: yargs =>
        yargs
          .positional('path', path)
          .options({
            project: {
              alias: 'p',
              type: 'string',
              array: true,
              desc: 'select project(s) to format (repeatable)',
            },
            files: {
              type: 'string',
              array: true,
              normalize: true,
              coerce: (files: string[]) => files.map(f => resolve(f)),
              desc: 'specific file(s) to format (repeatable)',
            },
            check: {
              type: 'boolean',
              desc: 'Check if files are formatted (exit with 1 if not)',
              default: false,
            },
          }),
      handler: async args => {
        const logger = createLikeC4Logger('c4:format')
        const timer = startTimer(logger)
        const checkOnly = args.check

        let languageServices
        try {
          languageServices = await fromWorkspace(args.path, { watch: false })
        } catch (e) {
          logger.error(e instanceof Error ? e.message : String(e))
          process.exitCode = 1
          return
        }
        await using _ = languageServices

        const projects = args.project?.filter(Boolean)
        const documentUris = args.files?.filter(Boolean).map(f => pathToFileURL(f).toString())

        logger.debug(`workspace: ${args.path}`)
        if (projects?.length) {
          logger.debug('projects:')
          for (const p of projects) {
            logger.debug(`  ${p}`)
          }
        }
        if (documentUris?.length) {
          logger.debug('files:')
          for (const uri of documentUris) {
            logger.debug(`  ${fileURLToPath(uri)}`)
          }
        }

        let formatted
        try {
          formatted = await languageServices.format({
            ...(projects?.length && { projects }),
            ...(documentUris?.length && { documentUris }),
          })
        } catch (e) {
          logger.error(e instanceof Error ? e.message : String(e))
          process.exitCode = 1
          return
        }

        logger.debug(`${formatted.size} document(s) to process`)

        const cwd = process.cwd()
        const displayPath = (absPath: string) => {
          const rel = relative(cwd, absPath)
          return rel.startsWith('..') ? absPath : rel
        }

        // Warn about any explicitly requested files that were not found in the workspace
        if (documentUris) {
          const skipped = documentUris.filter(uri => !formatted.has(uri))
          for (const uri of skipped) {
            logger.warn(`${k.yellow('skipped')} ${displayPath(fileURLToPath(uri))} (not found in workspace)`)
          }
        }

        // Apply formatting results to disk
        let changedFiles = 0
        let failedFiles = 0
        const needsFormatting: string[] = []

        for (const [docUri, formattedText] of formatted) {
          const fsPath = fileURLToPath(docUri)
          const relPath = displayPath(fsPath)

          let original: string
          try {
            original = await readFile(fsPath, 'utf-8')
          } catch (e) {
            logger.error(`Failed to read ${relPath}: ${e}`)
            failedFiles++
            continue
          }

          if (original === formattedText) {
            logger.debug(`${k.dim('unchanged')} ${relPath}`)
            continue
          }
          changedFiles++
          needsFormatting.push(relPath)

          if (checkOnly) {
            logger.info(`${k.yellow('needs formatting')} ${relPath}`)
          } else {
            try {
              await writeFile(fsPath, formattedText, 'utf-8')
              logger.info(`${k.green('formatted')} ${relPath}`)
            } catch (e) {
              logger.error(`Failed to write ${relPath}: ${e}`)
              failedFiles++
            }
          }
        }

        // Report results
        if (failedFiles > 0) {
          logger.error(`${failedFiles} file(s) failed to process`)
          process.exitCode = 1
          return
        }

        if (checkOnly) {
          if (changedFiles > 0) {
            logger.error(
              `${changedFiles} of ${formatted.size} file(s) need formatting:\n${
                needsFormatting.map(f => `  ${f}`).join('\n')
              }`,
            )
            process.exitCode = 1
            return
          }
          logger.info(k.green(`All ${formatted.size} file(s) are formatted`))
        } else {
          if (changedFiles > 0) {
            logger.info(`${k.green(String(changedFiles))} of ${formatted.size} file(s) formatted`)
          } else {
            logger.info(k.green(`All ${formatted.size} file(s) already formatted`))
          }
        }

        timer.stopAndLog('\u2713 format in ')
      },
    })
}

export default formatCmd
