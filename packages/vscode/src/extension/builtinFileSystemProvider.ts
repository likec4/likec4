import * as vscode from 'vscode'
// import { specification } from '@likec4/language-server/builtin'

export class BuiltinFS implements vscode.FileSystemProvider {

  static register(context: vscode.ExtensionContext) {
      context.subscriptions.push(
          vscode.workspace.registerFileSystemProvider('builtin', new BuiltinFS(), {
              isReadonly: true,
              isCaseSensitive: false
          }));
  }

  stat(_uri: vscode.Uri): vscode.FileStat {
    throw vscode.FileSystemError.NoPermissions();
      // const date = Date.now();
      // return {
      //     ctime: date,
      //     mtime: date,
      //     size: specification.document.length,
      //     type: vscode.FileType.File
      // };
  }

  readFile(_uri: vscode.Uri): Uint8Array {
    throw vscode.FileSystemError.NoPermissions();
      // We could return different libraries based on the URI
      // We have only one, so we always return the same
      // return new Uint8Array(Buffer.from(specification.document));
  }

  // The following class members only serve to satisfy the interface

  private readonly didChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  onDidChangeFile = this.didChangeFile.event;

  watch() {
      return {
          dispose: () => {
            // Nothing to do
          }
      };
  }

  readDirectory(): [] {
      throw vscode.FileSystemError.NoPermissions();
  }

  createDirectory() {
      throw vscode.FileSystemError.NoPermissions();
  }

  writeFile() {
      throw vscode.FileSystemError.NoPermissions();
  }

  delete() {
      throw vscode.FileSystemError.NoPermissions();
  }

  rename() {
      throw vscode.FileSystemError.NoPermissions();
  }
}
