import { type Api } from '$/api';
import { type aux, type ComputedView, type DiagramView, type LayoutedLikeC4ModelData, type ViewChange, type ViewId } from '@likec4/core';
import { LikeC4Model } from '@likec4/core/model';
import type { Locate as LocateRequest } from '@likec4/language-server/protocol';
import type { ShareOptions } from './shareOptions';
import type { LocalWorkspace, ShareHistoryItem } from './types';
export type DiagramState = {
    state: 'pending';
    view: ComputedView;
    diagram: null;
    dot: null;
    error: null;
} | {
    state: 'success';
    view: ComputedView;
    diagram: DiagramView;
    dot: string;
    error: null;
} | {
    state: 'error';
    view?: ComputedView | null;
    diagram?: DiagramView | null;
    dot?: string | null;
    error: string;
} | {
    state: 'stale';
    view: ComputedView;
    diagram: DiagramView | null;
    dot: string | null;
    error: string | null;
};
export type PlaygroundInput = LocalWorkspace;
export interface PlaygroundContext {
    workspaceId: string;
    workspaceTitle: string;
    shareHistory: Array<ShareHistoryItem>;
    /**
     * Current LikeC4 model.
     */
    likec4model: LikeC4Model<aux.UnknownComputed> | null;
    /**
     * Files in the workspace.
     */
    files: {
        [filename: string]: string;
    };
    activeFilename: string;
    /**
     * Original files in the workspace.
     * This is used to compare with the current files to detect changes.
     */
    originalFiles: {
        [filename: string]: string;
    };
    viewStates: Record<string, DiagramState>;
    /**
     * The view that is currently active.
     * If `null`, no view is active and panel is hidden.
     */
    activeViewId: ViewId | null;
    diagnosticErrors: string[];
    shareRequest: null | {
        layoutedLikeC4Data: LayoutedLikeC4ModelData | null;
        options: ShareOptions;
        success?: Api.Share.Response;
        error?: string | null;
    };
}
export type PlaygroundEvents = {
    type: 'monaco.onTextChanged';
    filename: string;
    modified: string;
} | {
    type: 'likec4.lsp.onLayoutedModel';
    model: LayoutedLikeC4ModelData;
} | {
    type: 'likec4.lsp.onLayoutedModelError';
    error: string;
} | {
    type: 'likec4.lsp.onDidChangeModel';
    model: LikeC4Model.Computed;
} | {
    type: 'likec4.lsp.onLayoutDone';
    dot: string;
    diagram: DiagramView;
} | {
    type: 'likec4.lsp.onLayoutError';
    viewId: ViewId;
    error: string;
} | {
    type: 'likec4.lsp.onDiagnostic';
    errors: string[];
} | {
    type: 'workspace.applyViewChanges';
    change: ViewChange;
} | {
    type: 'workspace.openSources';
    target: LocateRequest.Params;
} | {
    type: 'workspace.changeActiveView';
    viewId: ViewId;
} | {
    type: 'workspace.changeActiveFile';
    filename: string;
} | {
    type: 'workspace.addFile';
    filename: string;
    content: string;
} | {
    type: 'workspace.switch';
    workspace: PlaygroundInput;
} | {
    type: 'workspace.share';
    options: ShareOptions;
} | {
    type: 'workspace.persist';
} | {
    type: 'workspace.ready';
};
export type PlaygroundEmitted = {
    type: 'workspace.request-layouted-data';
} | {
    type: 'workspace.openSources';
    target: LocateRequest.Params;
} | {
    type: 'workspace.applyViewChanges';
    viewId: ViewId;
    change: ViewChange;
};
export declare const playgroundMachine: any;
export type PlaygroundMachineLogic = typeof playgroundMachine;
