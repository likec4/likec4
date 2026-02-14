import type { AdhocRule } from '../state/actor.types';
export declare function ViewRulesPanel({ rules, onToggle, onDelete, }: {
    rules: AdhocRule[];
    onToggle: (rule: AdhocRule) => void;
    onDelete: (rule: AdhocRule) => void;
}): import("react").JSX.Element;
