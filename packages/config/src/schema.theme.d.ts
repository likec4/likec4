import z from 'zod/v4';
export declare const ThemeColorValuesSchema: any;
export type ThemeColorValuesInput = z.input<typeof ThemeColorValuesSchema>;
export declare const LikeC4Config_Styles_Theme: any;
export type LikeC4ConfigThemeInput = z.input<typeof LikeC4Config_Styles_Theme>;
export declare const LikeC4StylesConfigSchema: any;
export interface LikeC4StylesConfig extends z.infer<typeof LikeC4StylesConfigSchema> {
}
export type LikeC4StylesConfigInput = z.input<typeof LikeC4StylesConfigSchema>;
