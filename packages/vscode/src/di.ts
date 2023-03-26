import type { ExtensionContext } from 'vscode'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'

// export type { ViewLayoutFn as LayoutFn } from '@c4x/layouts'
// export type { C4ModelImpl as C4Model } from './c4model'
// export type { PreviewPanel } from './panels/PreviewPanel'

export type { ExtensionContext, LanguageClient }

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
