import type { BorderStyle, DeploymentFqn, Fqn } from '@likec4/core/types';
import type { MergeExclusive } from 'type-fest';
import type { OnStyleChange } from './types';
export declare const Tooltip: import("react").ForwardRefExoticComponent<import("@mantine/core").TooltipProps & import("react").RefAttributes<HTMLDivElement> & {
    component?: any;
    renderRoot?: (props: Record<string, any>) => React.ReactNode;
}>;
export declare function BrowseRelationshipsButton({ fqn }: {
    fqn: Fqn;
}): import("react").JSX.Element;
export declare function GoToSourceButton(props: MergeExclusive<{
    elementId: Fqn;
}, {
    deploymentId: DeploymentFqn;
}>): import("react").JSX.Element;
export declare function BorderStyleOption({ elementBorderStyle, onChange, }: {
    elementBorderStyle: BorderStyle | undefined;
    onChange: OnStyleChange;
}): import("react").JSX.Element;
