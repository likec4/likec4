import type { IDisposable } from '@codingame/monaco-vscode-editor-api';
import * as monaco from '@codingame/monaco-vscode-editor-api';
import { type RegisteredFileSystemProvider } from '@codingame/monaco-vscode-files-service-override';
export declare const setActiveEditor: (filename: monaco.Uri) => void;
export declare function cleanDisposables(disposables: IDisposable[]): void;
export declare function createMemoryFileSystem(fsProvider: RegisteredFileSystemProvider, files: Record<string, string>, activeFilename: string): {
    docs: string[];
    activeModel: any;
};
/**
 * Ensure a single file exists in the workspace (e.g. after workspace.addFile).
 * Registers the file with fsProvider and creates a Monaco model if not present.
 */
export declare function ensureFileInWorkspace(fsProvider: RegisteredFileSystemProvider, filename: string, content: string): monaco.editor.ITextModel;
