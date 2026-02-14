export declare const Sizes: readonly ["xs", "sm", "md", "lg", "xl"];
export type Size = typeof Sizes[number];
export type TextSize = Size;
export type ShapeSize = Size;
export type SpacingSize = Size;
export type IconSize = Size;
export declare const IconPositions: readonly ["left", "right", "top", "bottom"];
export type IconPosition = typeof IconPositions[number];
export declare const BorderStyles: readonly ["solid", "dashed", "dotted", "none"];
export type BorderStyle = typeof BorderStyles[number];
export declare const ElementShapes: readonly ["rectangle", "person", "browser", "mobile", "cylinder", "storage", "queue", "bucket", "document", "component"];
export type ElementShape = typeof ElementShapes[number];
export declare const ThemeColors: readonly ["amber", "blue", "gray", "slate", "green", "indigo", "muted", "primary", "red", "secondary", "sky"];
export type ThemeColor = typeof ThemeColors[number];
export type Color = `#${string}`;
export interface ElementColorValues {
    readonly fill: Color;
    readonly stroke: Color;
    readonly hiContrast: Color;
    readonly loContrast: Color;
}
export interface RelationshipColorValues {
    readonly line: Color;
    readonly labelBg: Color;
    readonly label: Color;
}
export interface ThemeColorValues {
    readonly elements: ElementColorValues;
    readonly relationships: RelationshipColorValues;
}
export interface LikeC4Theme {
    readonly colors: Readonly<Record<ThemeColor, ThemeColorValues>>;
    readonly sizes: Readonly<Record<ShapeSize, {
        readonly width: number;
        readonly height: number;
    }>>;
    readonly spacing: Readonly<Record<SpacingSize, number>>;
    readonly textSizes: Readonly<Record<TextSize, number>>;
    readonly iconSizes: Readonly<Record<IconSize, number>>;
}
export declare const DefaultTagColors: readonly ["tomato", "grass", "blue", "ruby", "orange", "indigo", "pink", "teal", "purple", "amber", "crimson", "red", "lime", "yellow", "violet"];
