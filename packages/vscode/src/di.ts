import type { ExtensionContext } from 'vscode'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'
import type { DiagramLayoutFn } from '@likec4/layouts'
import type { C4ModelImpl } from './c4model'
import type { Logger } from './logger'
import type { PreviewPanel } from './panels/PreviewPanel'

export type {
  ExtensionContext,
  LanguageClient,
  Logger,
  DiagramLayoutFn as LayoutFn,
  C4ModelImpl as C4Model,
  PreviewPanel
}

export const di = {
  context: 'context', // vscode.ExtensionContext
  client: 'client', // LanguageClient
  c4model: 'c4model',
  previewPanel: 'previewPanel',
  logger: 'logger',
  layout: 'layout'
} as const

export interface ExtensionRequirements {
  context: ExtensionContext
  client: LanguageClient
}
