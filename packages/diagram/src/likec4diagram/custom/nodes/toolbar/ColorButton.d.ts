import type { LikeC4Theme, ThemeColor } from '@likec4/core';
import { type PopoverProps } from '@mantine/core';
import { type OnStyleChange } from './types';
type ColorButtonProps = Omit<PopoverProps, 'onChange'> & {
    elementColor: ThemeColor;
    elementOpacity?: number | undefined;
    isOpacityEditable?: boolean;
    onColorPreview: (color: ThemeColor | null) => void;
    onChange: OnStyleChange;
};
export declare function ColorButton({ elementColor, elementOpacity, onColorPreview, isOpacityEditable, onChange, ...props }: ColorButtonProps): import("react").JSX.Element;
export declare function ColorSwatches({ theme, elementColor, onColorPreview, onChange, }: {
    theme: LikeC4Theme;
    elementColor: ThemeColor;
    onColorPreview: (color: ThemeColor | null) => void;
    onChange: (color: ThemeColor) => void;
}): import("react").JSX.Element;
export declare function OpacityOption({ elementOpacity, onOpacityChange, }: {
    elementOpacity: number | undefined;
    onOpacityChange: (opacity: number) => void;
}): import("react").JSX.Element;
export {};
