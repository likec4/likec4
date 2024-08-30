import { type ThemeColorValues } from "@likec4/core"
import { entries } from "remeda";
import { vars } from "./theme.css";
import type { LikeC4CustomColorsProperties } from "./LikeC4CustomColors.props";

type CSSVarFunction = `var(--${string})` | `var(--${string}, ${string | number} )`;

export function LikeC4CustomColors({ customColors }: LikeC4CustomColorsProperties) {
    function toStyle(name: String, colorValues: ThemeColorValues): String {
        const rules = new Array<String>(
            ...entries(colorValues.elements).map(([key, value]) => `${stripCssVarReference(vars.element[key])}: ${value};`),
            ...entries(colorValues.relationships).map(([key, value]) => `${stripCssVarReference(vars.relation[key])}: ${value};`))
            .join('\n')

        return `:where([data-likec4-color=${name}]) {
            ${rules}
        }`
    }

    function stripCssVarReference(ref: CSSVarFunction): String {
        const end = ref.indexOf(',');
        return ref.substring(4, end == -1 ? ref.length - 1 : end);
    }

    const styles = entries(customColors)
        .map(([name, color]) => toStyle(name, color))
        .join('\n');

    return <>
        <style>
            {styles}
        </style>
    </>
}