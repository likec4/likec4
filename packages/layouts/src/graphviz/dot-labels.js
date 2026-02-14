import { LikeC4Styles, RichText, } from '@likec4/core';
import { nonexhaustive } from '@likec4/core/utils';
import { identity, isDefined, isTruthy } from 'remeda';
import wordWrap from 'word-wrap';
import { IconSizePoints, pxToPoints } from './utils';
export function sanitize(text) {
    return text.trim().replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
export function wrap(text, { maxchars, maxLines, sanitize: escape = identity(), }) {
    let lines = wordWrap(text, {
        width: maxchars,
        indent: '',
        escape,
    }).split('\n');
    if (isDefined(maxLines) && maxLines > 0 && lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
    }
    return lines;
}
function wrapWithFont({ text, maxchars, fontsize, maxLines, bold, color, }) {
    let html = wrap(text, { maxchars, maxLines, sanitize }).join('<BR/>');
    if (bold) {
        html = `<B>${html}</B>`;
    }
    const Color = color ? ` COLOR="${color}"` : ``;
    return `<FONT POINT-SIZE="${pxToPoints(fontsize)}"${Color}>${html}</FONT>`;
}
/**
 * "Faking" a node icon with a blue square
 * to preserve space for real icons.
 * #112233
 */
export function nodeIcon() {
    return `<TABLE FIXEDSIZE="TRUE" BGCOLOR="#112233" WIDTH="${IconSizePoints}" HEIGHT="${IconSizePoints}" BORDER="0" CELLPADDING="0" CELLSPACING="0"><TR><TD> </TD></TR></TABLE>`;
}
function maxchars(size) {
    switch (size) {
        case 'xs':
        case 'sm':
            return 30;
        case 'md':
            return 40;
        case 'lg':
        case 'xl':
            return 55;
        default:
            nonexhaustive(size);
    }
}
/**
 * Returns a formatted string for the given node, using the provided styles.
 * The output string is a HTML table containing the node's title, technology, and description.
 * If the node has an icon, the table will have a left padding of 60px (icon size) plus 10px (node margin).
 * If the node's shape is 'queue' or 'mobile', an additional 20px of padding is added.
 * The table will have a single row if the node has no icon and only one line of text.
 * @param {ComputedNode} node - The node to format.
 * @param {LikeC4Styles} styles - The styles to use for formatting.
 * @returns {string} A formatted string for the given node.
 */
export function nodeLabel(node, styles) {
    const { sizes: { size }, values } = styles.nodeSizes(node.style);
    const colorValues = styles.colors(node.color).elements;
    const isSmOrXs = ['sm', 'xs'].includes(size);
    const hasIcon = isTruthy(node.icon);
    const iconPosition = node.style.iconPosition ?? 'left';
    const hasIconOnSide = hasIcon && (iconPosition === 'left' || iconPosition === 'right');
    const lines = [
        wrapWithFont({
            text: node.title,
            fontsize: values.textSize,
            maxchars: maxchars(size),
            maxLines: isSmOrXs ? 1 : 3,
        }),
    ];
    if (size !== 'xs') {
        if (isTruthy(node.technology?.trim())) {
            lines.push(wrapWithFont({
                text: node.technology,
                fontsize: Math.ceil(values.textSize * 0.65),
                maxchars: hasIconOnSide ? 35 : 45,
                maxLines: 1,
                color: colorValues.loContrast,
            }));
        }
        const description = RichText.from(node.description).text;
        if (description) {
            lines.push(wrapWithFont({
                text: description,
                fontsize: Math.ceil(values.textSize * 0.75),
                maxchars: hasIconOnSide ? 35 : 45,
                maxLines: isSmOrXs ? 3 : 5,
                color: colorValues.loContrast,
            }));
        }
    }
    if (lines.length === 1 && hasIcon === false) {
        return `<${lines[0]}>`;
    }
    const rowMapper = hasIconOnSide
        ? (line, idx, all) => {
            let cell = `<TD ALIGN="TEXT" BALIGN="LEFT">${line}</TD>`;
            // if first row, prepend columns with ROWSPAN
            if (idx === 0) {
                const rowspan = all.length > 1 ? ` ROWSPAN="${all.length}"` : '';
                const iconWidth = Math.ceil(values.iconSize + 16);
                let leftwidth = iconWidth;
                const sidePad = 16;
                if (node.shape === 'queue' || node.shape === 'mobile') {
                    // add 20px padding more
                    leftwidth += 20;
                }
                if (iconPosition === 'right') {
                    cell = `<TD${rowspan} WIDTH="${sidePad}"> </TD>${cell}`;
                    cell = `${cell}<TD${rowspan} WIDTH="${leftwidth}"> </TD>`;
                }
                else {
                    // prepend empty cell (left padding)
                    cell = `<TD${rowspan} WIDTH="${leftwidth}"> </TD>${cell}`;
                    // append empty cell (right padding)
                    cell = `${cell}<TD${rowspan} WIDTH="${sidePad}"> </TD>`;
                }
            }
            return `<TR>${cell}</TR>`;
        }
        : (line) => {
            return `<TR><TD>${line}</TD></TR>`;
        };
    let rows = lines.map(rowMapper).join('');
    if (hasIcon && (iconPosition === 'top' || iconPosition === 'bottom')) {
        const iconRow = `<TR><TD HEIGHT="${Math.ceil(values.iconSize + 8)}"> </TD></TR>`;
        rows = iconPosition === 'top' ? `${iconRow}${rows}` : `${rows}${iconRow}`;
    }
    return `<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4">${rows}</TABLE>>`;
}
export function compoundLabel(node, color) {
    const html = wrapWithFont({
        text: node.title.toUpperCase(),
        maxchars: 50,
        fontsize: 11,
        maxLines: 1,
        bold: true,
        color,
    });
    if (html.includes('<BR/>')) {
        return `<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="0"><TR><TD ALIGN="TEXT" BALIGN="LEFT">${html}</TD></TR></TABLE>>`;
    }
    return `<${html}>`;
}
export const EDGE_LABEL_MAX_CHARS = 40;
export const EDGE_LABEL_MAX_LINES = 5;
const BGCOLOR = `BGCOLOR="${LikeC4Styles.DEFAULT.relationshipColors.labelBg}A0"`;
export function edgelabel({ label, technology }) {
    const lines = [];
    if (isTruthy(label?.trim())) {
        lines.push(wrapWithFont({
            text: label,
            maxchars: EDGE_LABEL_MAX_CHARS,
            fontsize: 14,
            maxLines: EDGE_LABEL_MAX_LINES,
            bold: label === '[...]',
        }));
    }
    // if (isTruthy(description)) {
    //   lines.push(
    //     wrapWithFont({
    //       text: description,
    //       maxchars: EDGE_LABEL_MAX_CHARS,
    //       maxLines: 4,
    //       fontsize: 14
    //     })
    //   )
    // }
    if (isTruthy(technology?.trim())) {
        lines.push(wrapWithFont({
            text: `[ ${technology} ]`,
            fontsize: 12,
            maxLines: 1,
            maxchars: EDGE_LABEL_MAX_CHARS,
        }));
    }
    if (lines.length === 0) {
        return null;
    }
    const rows = lines.map(line => `<TR><TD ALIGN="TEXT" BALIGN="LEFT">${line}</TD></TR>`).join('');
    return `<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" ${BGCOLOR}>${rows}</TABLE>>`;
}
export function stepEdgeLabel(step, text) {
    const num = `<TABLE BORDER="0" CELLPADDING="6" ${BGCOLOR}><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="${pxToPoints(14)}"><B>${step}</B></FONT></TD></TR></TABLE>`;
    if (!isTruthy(text?.trim())) {
        return `<${num}>`;
    }
    let html = [
        `<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3">`,
        `<TR>`,
        `<TD>${num}</TD>`,
        `<TD ${BGCOLOR} CELLPADDING="3">`,
        wrapWithFont({
            text,
            maxchars: EDGE_LABEL_MAX_CHARS,
            fontsize: 14,
            maxLines: 5,
        }),
        `</TD>`,
        `</TR>`,
        `</TABLE>`,
    ];
    return `<${html.join('')}>`;
}
