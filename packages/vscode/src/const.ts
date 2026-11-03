import * as vscode from 'vscode'
export const languageId = 'likec4'

export const globPattern = '**/?*.{c4,likec4,like-c4}'

export const hasAI = !!vscode.lm?.selectChatModels

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
