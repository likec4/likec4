import type { ExtensionContext } from 'vscode'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'
import type { DiagramLayoutFn } from '@likec4/layouts'

export type {
  ExtensionContext,
  LanguageClient,
  DiagramLayoutFn
}

export const di = {
  context: 'context', // vscode.ExtensionContext
  client: 'client', // LanguageClient
  c4model: 'c4model',
  previewPanel: 'previewPanel',
  layout: 'layout'
} as const

export interface ExtensionRequirements {
  context: ExtensionContext,
  client: LanguageClient,
}
