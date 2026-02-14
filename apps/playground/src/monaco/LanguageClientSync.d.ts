import type { LayoutedModelApi } from '$components/drawio/DrawioContextMenuProvider';
import type { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { type CustomWrapperConfig } from './config';
export declare function LanguageClientSync({ config, wrapper, setLayoutedModelApi, }: {
    config: CustomWrapperConfig;
    wrapper: MonacoEditorLanguageClientWrapper;
    setLayoutedModelApi?: (api: LayoutedModelApi | null) => void;
}): any;
