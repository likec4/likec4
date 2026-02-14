import { Examples } from '$/examples';
import { nonNullable } from '@likec4/core';
import { useSelector } from '@xstate/react';
import { deepEqual, shallowEqual } from 'fast-equals';
import { useCallback, useMemo } from 'react';
import { keys } from 'remeda';
import { _useOptionalPlaygroundActorRef as useOptionalPlaygroundActorRef, _usePlaygroundActorRef as usePlaygroundActorRef, } from './safeContext';
export { useOptionalPlaygroundActorRef, usePlaygroundActorRef };
export function usePlayground() {
    const playgroundActor = usePlaygroundActorRef();
    return useMemo(() => ({
        get actor() {
            return playgroundActor;
        },
        get workspaceId() {
            return playgroundActor.getSnapshot().context.workspaceId;
        },
        get value() {
            return playgroundActor.getSnapshot().value;
        },
        send: playgroundActor.send,
        getSnapshot: () => playgroundActor.getSnapshot(),
        getContext: () => playgroundActor.getSnapshot().context,
        getActiveFile: () => {
            const ctx = playgroundActor.getSnapshot().context;
            return ({
                filename: ctx.activeFilename,
                text: ctx.files[ctx.activeFilename] ?? '',
                isChanged: ctx.files[ctx.activeFilename] !== ctx.originalFiles[ctx.activeFilename],
            });
        },
        changeActiveFile: (filename) => {
            const ctx = playgroundActor.getSnapshot().context;
            if (ctx.activeFilename !== filename) {
                playgroundActor.send({
                    type: 'workspace.changeActiveFile',
                    filename,
                });
            }
        },
        changeActiveView: (viewId) => {
            playgroundActor.send({
                type: 'workspace.changeActiveView',
                viewId,
            });
        },
        openSources: (target) => {
            playgroundActor.send({
                type: 'workspace.openSources',
                target,
            });
        },
        applyViewChanges: (change) => {
            playgroundActor.send({
                type: 'workspace.applyViewChanges',
                change,
            });
        },
    }), [playgroundActor]);
}
export function usePlaygroundContext(selector, compare = shallowEqual, deps = []) {
    const playgroundActor = usePlaygroundActorRef();
    const select = useCallback((s) => selector(s.context), deps);
    return useSelector(playgroundActor, select, compare);
}
export function usePlaygroundSnapshot(selector, compare = shallowEqual, deps = []) {
    const playgroundActor = usePlaygroundActorRef();
    return useSelector(playgroundActor, useCallback(selector, deps), compare);
}
const selectWorkspace = (snapshot) => ({
    workspaceId: snapshot.context.workspaceId,
    workspaceTitle: snapshot.context.workspaceTitle,
    filenames: keys(snapshot.context.files),
    activeFilename: snapshot.context.activeFilename,
    isExample: !!Examples[snapshot.context.workspaceId],
    hasChanges: !shallowEqual(snapshot.context.files, snapshot.context.originalFiles),
});
export function usePlaygroundWorkspace() {
    const playgroundActor = usePlaygroundActorRef();
    return useSelector(playgroundActor, selectWorkspace, deepEqual);
}
const selectWorkspaceActiveFile = (snapshot) => ({
    filename: snapshot.context.activeFilename,
    text: snapshot.context.files[snapshot.context.activeFilename] ?? '',
    isChanged: snapshot.context.files[snapshot.context.activeFilename] !==
        snapshot.context.originalFiles[snapshot.context.activeFilename],
});
export function usePlaygroundActiveFile() {
    const playgroundActor = usePlaygroundActorRef();
    return useSelector(playgroundActor, selectWorkspaceActiveFile, shallowEqual);
}
const selectLikeC4Model = (snapshot) => snapshot.context.likec4model;
export function usePlaygroundLikeC4Model() {
    const playgroundActor = usePlaygroundActorRef();
    const likeC4Model = useSelector(playgroundActor, selectLikeC4Model);
    return nonNullable(likeC4Model, 'LikeC4 model is not loaded');
}
