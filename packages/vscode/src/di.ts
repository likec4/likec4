import type { ExtensionContext } from 'vscode'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'
import type { C4ModelImpl } from './c4model'
import type { Logger } from './logger'
import type { LayoutFn } from './layout'
import type { PreviewPanel } from './panels/PreviewPanel'
import type TelemetryReporter from '@vscode/extension-telemetry'

export type {
  ExtensionContext,
  LanguageClient,
  Logger,
  LayoutFn,
  C4ModelImpl as C4Model,
  PreviewPanel,
  TelemetryReporter as Telemetry
}

export const di = {
  context: 'context', // vscode.ExtensionContext
  // output: 'output', // vscode.LogOutputChannel
  client: 'client', // LanguageClient
  c4model: 'c4model',
  previewPanel: 'previewPanel',
  logger: 'logger',
  layout: 'layout',
  telemetry: 'telemetry'
} as const

export interface ExtensionRequirements {
  context: ExtensionContext
  client: LanguageClient
  reporter: TelemetryReporter
  // output: LogOutputChannel
}
