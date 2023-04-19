import { createLanguageServices, type LikeC4Services } from '@likec4/language-server'
import chalk from 'chalk'
import type { LanguageMetaData } from 'langium'
import { NodeFileSystem } from 'langium/node'
import type { LikeC4Model } from '@likec4/core/types'
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { URI } from 'vscode-uri'

function resolveWorkspaceDir(workspaceDir: string): string {
  if (!path.isAbsolute(workspaceDir)) {
    workspaceDir = path.resolve(process.cwd(), workspaceDir)
  }
  if (!existsSync(workspaceDir)) {
    throw new Error(`Workspace '${workspaceDir}' does not exist`)
  }
  if (!statSync(workspaceDir).isDirectory()) {
    throw new Error(`Workspace '${workspaceDir}' is not a directory.`)
  }
  return workspaceDir
}

export async function initLanguageServices(props?: { workspaceDir?: string }): Promise<{
  workspace: string
  metaData: LanguageMetaData
  services: LikeC4Services
  model: LikeC4Model
}> {
  const workspace = props?.workspaceDir ? resolveWorkspaceDir(props.workspaceDir) : process.cwd()

  const services = createLanguageServices(NodeFileSystem).likec4
  const metaData = services.LanguageMetaData
  const modelBuilder = services.likec4.ModelBuilder

  console.log(chalk.dim('🔍 Searching for likec4 files in:'))
  console.log(chalk.dim('   ' + workspace))

  await services.shared.workspace.WorkspaceManager.initializeWorkspace([
    {
      name: path.basename(workspace),
      uri: URI.file(workspace).toString()
    }
  ])

  const documents = services.shared.workspace.LangiumDocuments.all.toArray()
  if (documents.filter(d => d.uri.scheme !== 'builtin').length === 0) {
    console.log(chalk.red`No likec4 files found`)
    process.exit(1)
  }

  console.log(chalk.dim('🔍 Validating...'))
  await services.shared.workspace.DocumentBuilder.build(documents, { validationChecks: 'all' })

  let hasErrors = false
  for (const doc of documents) {
    const errors = doc.diagnostics?.filter(e => e.severity === 1)
    const docPath = path.relative(workspace, doc.uri.fsPath)
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
    if (doc.uri.scheme === 'builtin') {
      console.log(chalk.green('   ✅ ' + doc.uri.toString()))
    } else {
      console.log(chalk.green('   ✅ ' + docPath))
    }
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

  return {
    workspace,
    metaData,
    services,
    model
  }
}
