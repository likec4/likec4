import type { LayoutedModelApi } from '$components/drawio/DrawioContextMenuProvider';
export type MonacoEditorProps = {
    setLayoutedModelApi?: (api: LayoutedModelApi | null) => void;
};
declare const LazyMonacoEditor: import("react").MemoExoticComponent<(props: MonacoEditorProps) => import("react").JSX.Element>;
export default LazyMonacoEditor;
