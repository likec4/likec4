import * as monaco from '@codingame/monaco-vscode-editor-api';
import { RegisteredFileSystemProvider } from '@codingame/monaco-vscode-files-service-override';
import type { WrapperConfig } from 'monaco-editor-wrapper';
export type CustomWrapperConfig = WrapperConfig & {
    fsProvider: RegisteredFileSystemProvider;
};
export type MonacoEditorApp = monaco.editor.IStandaloneCodeEditor;
export declare const createWrapperConfig: (params: {
    onActiveEditorChanged?: (filename: string) => void;
    getActiveEditor: () => MonacoEditorApp | null;
}) => CustomWrapperConfig;
export declare const loadLikeC4Worker: () => Worker;
