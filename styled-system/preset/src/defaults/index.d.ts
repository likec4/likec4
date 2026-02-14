import { type ThemeColorValues } from './types.ts';
export declare const defaultTheme: {
    readonly sizes: {
        readonly xs: {
            readonly width: 180;
            readonly height: 100;
        };
        readonly sm: {
            readonly width: 240;
            readonly height: 135;
        };
        readonly md: {
            readonly width: 320;
            readonly height: 180;
        };
        readonly lg: {
            readonly width: 420;
            readonly height: 234;
        };
        readonly xl: {
            readonly width: 520;
            readonly height: 290;
        };
    };
    readonly spacing: {
        readonly xs: 8;
        readonly sm: 10;
        readonly md: 16;
        readonly lg: 24;
        readonly xl: 32;
    };
    readonly textSizes: {
        readonly xs: 13.33;
        readonly sm: 16;
        readonly md: 19.2;
        readonly lg: 23.04;
        readonly xl: 27.65;
    };
    readonly iconSizes: {
        readonly xs: 24;
        readonly sm: 36;
        readonly md: 60;
        readonly lg: 82;
        readonly xl: 90;
    };
    readonly colors: Record<"blue" | "gray" | "green" | "indigo" | "red" | "muted" | "primary" | "amber" | "slate" | "secondary" | "sky", ThemeColorValues>;
};
export * from './element-colors.ts';
export * from './relationship-colors.ts';
export * from './types.ts';
export * from './vars.ts';
