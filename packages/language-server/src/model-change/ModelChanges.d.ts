import { type ViewChange } from '@likec4/core';
import { Range, TextEdit } from 'vscode-languageserver-types';
import type { ViewLocateResult } from '../model';
import type { LikeC4Services } from '../module';
import type { ChangeView } from '../protocol';
export declare class LikeC4ModelChanges {
    private services;
    private locator;
    constructor(services: LikeC4Services);
    applyChange(changeView: ChangeView.Params): Promise<ChangeView.Res>;
    protected convertToTextEdit({ lookup, change }: {
        lookup: ViewLocateResult;
        change: Exclude<ViewChange, ViewChange.SaveViewSnapshot | ViewChange.ResetManualLayout>;
    }): {
        modifiedRange: Range;
        edits: TextEdit[];
    };
}
