import type { NonEmptyArray } from './_common';
import type * as scalar from './scalar';
import type { BorderStyle, ElementShape, ThemeColor } from './styles';
import type { LayoutedView } from './view';
import type { AutoLayoutDirection } from './view-common';
export declare namespace ViewChange {
    interface ChangeElementStyle {
        op: 'change-element-style';
        style: {
            border?: BorderStyle;
            opacity?: number;
            shape?: ElementShape;
            color?: ThemeColor;
        };
        targets: NonEmptyArray<scalar.Fqn | scalar.DeploymentFqn>;
    }
    interface SaveViewSnapshot {
        op: 'save-view-snapshot';
        layout: LayoutedView;
    }
    interface ResetManualLayout {
        op: 'reset-manual-layout';
    }
    interface ChangeAutoLayout {
        op: 'change-autolayout';
        layout: {
            direction: AutoLayoutDirection;
            nodeSep?: number | null;
            rankSep?: number | null;
        };
    }
}
export type ViewChange = ViewChange.ChangeElementStyle | ViewChange.SaveViewSnapshot | ViewChange.ResetManualLayout | ViewChange.ChangeAutoLayout;
