import { type DefaultMantineColor, type MantineColorsTuple, type MantineThemeOverride } from '@mantine/core';
export declare const theme: MantineThemeOverride;
type ExtendedCustomColors = 'main' | DefaultMantineColor;
declare module '@mantine/core' {
    interface MantineThemeColorsOverride {
        colors: Record<ExtendedCustomColors, MantineColorsTuple>;
    }
}
export {};
