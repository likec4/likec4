// SPDX-License-Identifier: MIT

import { describe, expect, it, vi } from 'vitest'

vi.mock('vscode', () => ({
  Uri: {
    joinPath: (base: { fsPath: string }, ...parts: string[]) => ({
      fsPath: [base.fsPath, ...parts].join('/').replaceAll('/../', '/'),
    }),
    file: (path: string) => ({ fsPath: path, scheme: 'file' }),
  },
  window: {
    activeTextEditor: undefined,
    activeColorTheme: { kind: 1 },
  },
  workspace: {
    workspaceFolders: undefined,
    textDocuments: [],
  },
  ColorThemeKind: {
    Light: 1,
    Dark: 2,
    HighContrast: 3,
    HighContrastLight: 4,
  },
}))

import type * as vscode from 'vscode'
import { defaultPngSaveUri } from './exportPngShared'

describe('defaultPngSaveUri', () => {
  it('joins the view id under the workspace folder', () => {
    const folder = {
      uri: { fsPath: '/tmp/ws', scheme: 'file' },
      name: 'ws',
      index: 0,
    } as vscode.WorkspaceFolder
    expect(defaultPngSaveUri('index', folder).fsPath).toBe('/tmp/ws/index.png')
  })
})
