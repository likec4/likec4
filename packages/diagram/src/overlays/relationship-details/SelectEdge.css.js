"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrollArea = exports.edgeDataGrid = exports.edgeGrid = exports.edgeRow = exports.edgeLabel = exports.edgeTarget = exports.edgeArrow = exports.edgeSource = void 0;
var css_1 = require("@likec4/styles/css");
var edgeEnpoint = css_1.css.raw({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '[6px 2px 0 2px]',
    '& .mantine-Text-root': {
        color: 'text/90',
        fontSize: 'xs',
        fontWeight: 'medium',
        lineHeight: '1.2',
    },
});
exports.edgeSource = (0, css_1.css)({
    paddingLeft: '1',
    gridColumn: 1,
}, edgeEnpoint);
exports.edgeArrow = (0, css_1.css)({
    gridColumn: 2,
}, edgeEnpoint);
exports.edgeTarget = (0, css_1.css)({
    gridColumn: 3,
    paddingRight: '1',
}, edgeEnpoint);
var edgeLabelclass = 'likec4-edge-label';
exports.edgeLabel = (0, css_1.cx)(edgeLabelclass, (0, css_1.css)({
    display: 'grid',
    gridColumnStart: 1,
    gridColumnEnd: 4,
    borderBottom: "1px solid",
    borderBottomColor: 'default.border',
    marginBottom: '0',
    padding: '[0 4px 5px 4px]',
    width: '100%',
    '& .mantine-Text-root': {
        fontSize: 'xxs',
        fontWeight: 'normal',
        lineHeight: 'xs',
        color: 'text.dimmed',
    },
}));
exports.edgeRow = (0, css_1.css)((_a = {
        display: 'contents'
    },
    _a["&:last-child .".concat(edgeLabelclass)] = {
        borderBottom: 'none',
        marginBottom: '0',
    },
    _a['& > *'] = {
        transition: 'all 0.15s ease-in',
    },
    _a['&:is(:hover, [data-selected=true]) > *'] = {
        transition: 'all 0.15s ease-out',
        cursor: 'pointer',
        backgroundColor: 'default.hover',
    },
    _a));
exports.edgeGrid = (0, css_1.css)({
    display: 'grid',
    gridTemplateColumns: '1fr 30px 1fr',
    gridAutoRows: 'min-content max-content',
    gap: '0',
    alignItems: 'stretch',
});
exports.edgeDataGrid = (0, css_1.css)({
    display: 'grid',
    gridTemplateColumns: 'min-content 1fr',
    gridAutoRows: 'min-content max-content',
    gap: '[10px 12px]',
    alignItems: 'baseline',
    justifyItems: 'start',
});
exports.scrollArea = (0, css_1.css)({
    maxHeight: [
        '70vh',
        'calc(100cqh - 70px)',
    ],
});
