import chroma from 'chroma-js';
import type { ColorLiteral, HexColor, ThemeColorValues } from './types';
export declare function computeColorValues(color: ColorLiteral): ThemeColorValues;
export declare function getContrastedColorsAPCA(refColor: string | chroma.Color): {
    hiContrast: HexColor;
    loContrast: HexColor;
};
