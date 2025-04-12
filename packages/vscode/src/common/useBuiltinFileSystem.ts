import { Scheme } from '@likec4/language-server/likec4lib'
import { createSingletonComposable, useDisposable } from 'reactive-vscode'
import vscode from 'vscode'
import { BuiltInFileSystemProvider } from './BuiltInFileSystemProvider'

export const useBuiltinFileSystem = createSingletonComposable(() => {
  useDisposable(vscode.workspace.registerFileSystemProvider(Scheme, new BuiltInFileSystemProvider(), {
    isReadonly: true,
    isCaseSensitive: false,
  }))
})
