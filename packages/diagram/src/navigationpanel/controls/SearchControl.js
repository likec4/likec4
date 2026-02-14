"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchControl = SearchControl;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var patterns_1 = require("@likec4/styles/patterns");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var system_1 = require("@xyflow/system");
var m = require("motion/react-m");
var useDiagram_1 = require("../../hooks/useDiagram");
function SearchControl() {
    var diagram = (0, useDiagram_1.useDiagram)();
    var isMac = (0, system_1.isMacOs)();
    return (<core_1.UnstyledButton component={m.button} layout="position" onClick={function (e) {
            e.stopPropagation();
            diagram.openSearch();
        }} whileTap={{
            scale: 0.95,
            translateY: 1,
        }} className={(0, css_1.cx)('group', (0, patterns_1.hstack)({
            gap: 'xxs',
            paddingInline: 'sm',
            paddingBlock: 'xxs',
            userSelect: 'none',
            layerStyle: 'likec4.panel.action.filled',
            display: {
                base: 'none',
                '@/md': 'flex',
            },
        }))}>
      <icons_react_1.IconSearch size={14} stroke={2.5}/>
      <jsx_1.Box css={{
            fontSize: '11px',
            fontWeight: 'bold',
            lineHeight: 1,
            opacity: 0.8,
            whiteSpace: 'nowrap',
        }}>
        {isMac ? '⌘ + K' : 'Ctrl + K'}
      </jsx_1.Box>
    </core_1.UnstyledButton>);
}
