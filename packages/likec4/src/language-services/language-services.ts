/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { type LikeC4Services } from '@likec4/language-server'
import { GraphvizWasmAdapter } from '@likec4/layouts/graphviz/wasm'
import { DocumentState } from 'langium'
import { resolve } from 'node:path'
import { hrtime } from 'node:process'
import k from 'picocolors'
import type { Logger } from 'vite'
import pkg from '../../package.json' assert { type: 'json' }
import { createServices } from './module'
import { languageServicesUtils } from './utils'

export type LanguageServicesOptions = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  logValidationErrors?: boolean
  /**
   * If true, the graphviz layouter will use the binary version of graphviz.
   * By default, it uses the wasm version.
   * @default false
   */
  useDotBin: boolean
}

function mkPrintValidationErrors(services: LikeC4Services, logger: Logger) {
  const LangiumDocuments = services.shared.workspace.LangiumDocuments
  /**
   * Returns true if there are some validation errors.
   */
  return (docs = LangiumDocuments.all.toArray()) => {
    let cleanScreenIfError = true
    for (const doc of docs) {
      const errors = doc.diagnostics?.filter(e => e.severity === 1)
      if (errors && errors.length > 0) {
        if (cleanScreenIfError) {
          logger.clearScreen('info')
          cleanScreenIfError = false
        }
        const messages = errors
          .map(validationError => {
            // const errorRange = doc.textDocument.getText(validationError.range)
            const line = validationError.range.start.line
            return '     ' + k.dim(`Line ${line}: `) + k.red(validationError.message)
          })
          .join('\n')
        logger.error(`Invalid ${doc.uri.fsPath}\n${messages}`)
      }
    }
    return cleanScreenIfError !== true
  }
}

export async function mkLanguageServices({
  path,
  logValidationErrors = true,
  useDotBin = false
}: LanguageServicesOptions) {
  const services = createServices({ useDotBin }).likec4
  const logger = services.logger
  logger.info(`${k.dim('version')} ${pkg.version}`)
  logger.info(`${k.dim('layout')} ${services.likec4.Layouter.port instanceof GraphvizWasmAdapter ? 'wasm' : 'binary'}`)

  const workspace = resolve(path)

  await services.cli.Workspace.init(path)

  const {
    errorDiagnostics,
    hasErrors,
    notifyUpdate,
    onModelUpdate
  } = languageServicesUtils(services)

  const printValidationErrors = mkPrintValidationErrors(services, logger)

  if (logValidationErrors) {
    services.shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, docs => {
      printValidationErrors(docs)
    })
  }

  return {
    // Resolved workspace directory
    workspace,
    model: services.likec4.ModelBuilder,
    views: services.likec4.Views,
    notifyUpdate,
    onModelUpdate,
    hasErrors,
    getErrors: errorDiagnostics,
    printErrors: () => printValidationErrors()
  }
}

export type LanguageServices = Awaited<ReturnType<typeof mkLanguageServices>>

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LanguageServices {
  export async function get(opts?: Partial<LanguageServicesOptions>) {
    let instance = (globalThis as any)['LikeC4LanguageServices'] as LanguageServices | undefined
    if (!instance) {
      instance = await mkLanguageServices({
        path: opts?.path ?? process.cwd(),
        logValidationErrors: opts?.logValidationErrors ?? true,
        useDotBin: opts?.useDotBin ?? false
      })
      if (instance.printErrors()) {
        // setImmediate(() => {
        process.exit(1)
        // })
        // return Promise.reject(new Error('validation failed'))
      }
      ;(globalThis as any)['LikeC4LanguageServices'] = instance
    }
    return instance
  }
}
