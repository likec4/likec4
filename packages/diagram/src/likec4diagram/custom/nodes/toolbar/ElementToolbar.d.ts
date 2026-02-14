import type { Fqn } from '@likec4/core/types';
import type { Types } from '../../../types';
export declare function ElementToolbar(props: Types.NodeProps<'element' | 'seq-actor'> & {
    data: {
        modelFqn: Fqn;
    };
}): import("react").JSX.Element;
export declare function DeploymentElementToolbar(props: Types.NodeProps<'deployment'>): import("react").JSX.Element;
