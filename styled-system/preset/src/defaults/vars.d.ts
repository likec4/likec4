export declare const vars: {
    readonly font: "--likec4-app-font";
    readonly spacing: "--likec4-spacing";
    readonly textsize: "--likec4-text-size";
    readonly palette: {
        readonly fill: "--likec4-palette-fill";
        readonly stroke: "--likec4-palette-stroke";
        readonly hiContrast: "--likec4-palette-hiContrast";
        readonly loContrast: "--likec4-palette-loContrast";
        readonly relationStroke: "--likec4-palette-relation-stroke";
        readonly relationStrokeSelected: "--likec4-palette-relation-stroke-selected";
        readonly relationLabel: "--likec4-palette-relation-label";
        readonly relationLabelBg: "--likec4-palette-relation-label-bg";
        readonly outline: "--likec4-palette-outline";
    };
    readonly icon: {
        readonly size: "--likec4-icon-size";
        readonly color: "--likec4-icon-color";
    };
};
type Vars = Exclude<keyof typeof vars, 'palette' | 'icon'> | `palette.${keyof typeof vars.palette}` | `icon.${keyof typeof vars.icon}`;
/**
 * Returns a CSS variable declaration string.
 *
 * If `defaultTo` is not provided, returns a string like `var(--likec4-palette-fill)`.
 * If `defaultTo` is a Vars or string, returns a string like `var(--likec4-palette-fill, var(--default-to))`.
 *
 * @param key - The name of the CSS variable to generate.
 * @param defaultTo - An optional string, Vars, or object to use as the default value.
 * @returns A CSS variable declaration string.
 */
export declare function __v(key: Vars, defaultTo?: Vars | `var(${string})` | `{${string}}` | (string & Record<never, unknown>)): `var(${string})`;
export {};
