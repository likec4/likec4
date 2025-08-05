import * as vscode from 'vscode'
export const languageId = 'likec4'
export const extensionName = 'likec4'
export const extensionTitle = 'LikeC4'

export const fileExtensions = ['.c4', '.likec4', '.like-c4'] as const

export const globPattern = '**/*.{c4,likec4,like-c4}'

export const isWebUi = () => vscode.env.uiKind === vscode.UIKind.Web
export const isVirtual = () => vscode.workspace.workspaceFolders?.every(f => f.uri.scheme !== 'file') || false

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string | undefined
    }
  }
}

// Replaced by esbuild define
export const isProd = process.env.NODE_ENV === 'production'
export const isDev = process.env.NODE_ENV !== 'production'
