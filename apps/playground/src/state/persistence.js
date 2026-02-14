import { Examples } from '$/examples';
import { invariant } from '@likec4/core'; // changed from @tanstack/react-router by Gemini 5
import { first, keys } from 'remeda';
export function readWorkspace(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}
function workspacePersistence(storage) {
    return {
        read(workspaceId) {
            const key = `likec4:workspace:${workspaceId}`;
            try {
                let fromStorage = storage.getItem(key);
                if (fromStorage) {
                    const parsed = JSON.parse(fromStorage);
                    let activeFilename = parsed.activeFilename || parsed.currentFilename;
                    if (!activeFilename) {
                        activeFilename = first(keys(parsed.files));
                    }
                    invariant(activeFilename, 'activeFilename is required');
                    return {
                        ...parsed,
                        workspaceId,
                        activeFilename,
                        files: {
                            [activeFilename]: '',
                            ...parsed.files,
                        },
                        title: parsed.title ?? workspaceId,
                    };
                }
                return null;
            }
            catch (e) {
                console.error(`Error reading fromStorage ${key}:`, e);
                return null;
            }
        },
        /**
         * @returns key to read the workspace back
         */
        write({ shareHistory, ...workspace }) {
            storage.setItem(`likec4:workspace:${workspace.workspaceId}`, JSON.stringify({
                ...workspace,
                ...shareHistory && shareHistory.length > 0 && { shareHistory },
            }));
            return `likec4:workspace:${workspace.workspaceId}`;
        },
    };
}
// TEMP: This is a temporary function to write workspace to localStorage
export const WorkspacePersistence = workspacePersistence(localStorage);
export const WorkspaceSessionPersistence = workspacePersistence(sessionStorage);
export function selectWorkspacePersistence(workspaceId) {
    return workspaceId in Examples ? WorkspaceSessionPersistence : WorkspacePersistence;
}
