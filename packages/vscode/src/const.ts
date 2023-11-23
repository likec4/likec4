import * as vscode from 'vscode'

export const languageId = 'likec4' as const
export const extensionName = 'likec4' as const
export const extensionTitle = 'LikeC4' as const
export const cmdReady = `${extensionName}.ready` as const
export const cmdOpenPreview = `${extensionName}.open-preview` as const
export const cmdRebuild = `${extensionName}.rebuild` as const
export const cmdPreviewContextOpenSource = `${extensionName}.preview-context-open-source` as const

export const fileExtensions = ['.c4', '.likec4', '.like-c4'] as const

export const globPattern = '**/*.{c4,likec4,like-c4}'

// Application insights key (also known as instrumentation key)
export const telemetryKey = '36d9aa84-b503-45ea-ae34-b236e4f83bea' as const

export const isWebUi = () => vscode.env.uiKind === vscode.UIKind.Web
export const isVirtual = () =>
  vscode.workspace.workspaceFolders?.every(f => f.uri.scheme !== 'file') || false
