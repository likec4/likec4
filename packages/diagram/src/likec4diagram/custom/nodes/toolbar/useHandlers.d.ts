import type { DeploymentFqn, Fqn, ThemeColor } from '@likec4/core';
import type { Types } from '../../../types';
import type { OnStyleChange } from './types';
export declare function useHandlers(target: Fqn | DeploymentFqn, props: Types.NodeProps): {
    elementColor: any;
    onColorPreview: (color: ThemeColor | null) => void;
    onChange: OnStyleChange;
};
