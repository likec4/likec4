import { createLanguageServices, type LikeC4Services } from '@likec4/language-server'
import chalk from 'chalk'
import type { LanguageMetaData } from 'langium'
import { NodeFileSystem } from 'langium/node'
import type { LikeC4Model, ViewID } from '@likec4/core/types'
import { existsSync, statSync } from 'node:fs'
import { resolve, relative, isAbsolute, basename } from 'node:path/posix'
import * as R from 'remeda'
import { URI } from 'vscode-uri'

export function resolveDir(workspaceDir: string): string {
  if (workspaceDir === '.') {
    return process.cwd()
  }
  if (!isAbsolute(workspaceDir)) {
    workspaceDir = resolve(process.cwd(), workspaceDir)
  }
  if (!existsSync(workspaceDir)) {
    throw new Error(`Directory '${workspaceDir}' does not exist`)
  }
  if (!statSync(workspaceDir).isDirectory()) {
    throw new Error(`'${workspaceDir}' is not a directory.`)
  }
  return workspaceDir
}

export async function initLanguageServices(props?: { workspaceDir?: string }): Promise<{
  workspace: string
  metaData: LanguageMetaData
  services: LikeC4Services
  model: LikeC4Model
  viewSourcePaths: Record<ViewID, string>
}> {
  const workspace = props?.workspaceDir ? resolveDir(props.workspaceDir) : process.cwd()

  const services = createLanguageServices(NodeFileSystem).likec4
  const metaData = services.LanguageMetaData
  const modelBuilder = services.likec4.ModelBuilder
  const modelLocator = services.likec4.ModelLocator

  console.log(chalk.dim('🔍 Searching for likec4 files in:'))
  console.log('\t' + chalk.dim(workspace))

  await services.shared.workspace.WorkspaceManager.initializeWorkspace([
    {
      name: basename(workspace),
      uri: URI.file(workspace).toString()
    }
  ])

  const documents = services.shared.workspace.LangiumDocuments.all.toArray()
  if (documents.length === 0) {
    console.log(chalk.red`No likec4 files found`)
    process.exit(1)
  }

  console.log(chalk.dim('🔍 Validating...'))
  await services.shared.workspace.DocumentBuilder.build(documents, { validationChecks: 'all' })

  let hasErrors = false
  for (const doc of documents) {
    const errors = doc.diagnostics?.filter(e => e.severity === 1)
    const docPath = relative(workspace, doc.uri.fsPath)
    if (errors && errors.length > 0) {
      hasErrors = true
      console.log(chalk.red('   ⛔️ ' + docPath))
      for (const validationError of errors) {
        console.log(
          chalk.red(
            `      line ${validationError.range.start.line}: ${validationError.message
            } [${doc.textDocument.getText(validationError.range)}]`
          )
        )
      }
      continue
    }
    console.log(chalk.green('   ✅ ' + docPath))
  }

  if (hasErrors) {
    process.exit(1)
  }

  console.log(chalk.dim`🔍 Building model`)

  const model = modelBuilder.buildModel()

  if (!model) {
    console.log(chalk.red`Failed to build model`)
    process.exit(1)
  }

  const viewSourcePaths = R.mapValues(model.views, v => {
    const loc = modelLocator.locateView(v.id)
    if (!loc) {
      throw new Error(`No location found for view ${v.id}`)
    }
    return relative(workspace, URI.parse(loc.uri).fsPath)
  })

  return {
    workspace,
    metaData,
    services,
    model,
    viewSourcePaths
  }
}
