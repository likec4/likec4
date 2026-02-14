import { Examples } from '$/examples';
import type { LocalWorkspace } from './types';
export declare function readWorkspace(key: string): any;
export declare const WorkspacePersistence: {
    read(workspaceId: string): {
        workspaceId: string;
        activeFilename: string;
        files: {
            [x: string]: string;
        };
        title: string;
        shareHistory?: Array<import("./types").ShareHistoryItem>;
        forkedFrom?: {
            shareId: string;
            author: Examples | null;
            expiresAt: Examples;
        };
        currentFilename?: string;
    };
    /**
     * @returns key to read the workspace back
     */
    write({ shareHistory, ...workspace }: LocalWorkspace): string;
};
export declare const WorkspaceSessionPersistence: {
    read(workspaceId: string): {
        workspaceId: string;
        activeFilename: string;
        files: {
            [x: string]: string;
        };
        title: string;
        shareHistory?: Array<import("./types").ShareHistoryItem>;
        forkedFrom?: {
            shareId: string;
            author: Examples | null;
            expiresAt: Examples;
        };
        currentFilename?: string;
    };
    /**
     * @returns key to read the workspace back
     */
    write({ shareHistory, ...workspace }: LocalWorkspace): string;
};
export declare function selectWorkspacePersistence(workspaceId: string): {
    read(workspaceId: string): {
        workspaceId: string;
        activeFilename: string;
        files: {
            [x: string]: string;
        };
        title: string;
        shareHistory?: Array<import("./types").ShareHistoryItem>;
        forkedFrom?: {
            shareId: string;
            author: Examples | null;
            expiresAt: Examples;
        };
        currentFilename?: string;
    };
    /**
     * @returns key to read the workspace back
     */
    write({ shareHistory, ...workspace }: LocalWorkspace): string;
};
