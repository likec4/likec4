"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toolbar = Toolbar;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var hooks_1 = require("@mantine/hooks");
var react_1 = require("@xyflow/react");
var useDiagram_1 = require("../../../../hooks/useDiagram");
var xyflow_1 = require("../../../../utils/xyflow");
var styles = require("./styles.css");
var selectSelectedNodesCount = function (context) {
    return context.xynodes.filter(function (x) { return x.selected; }).length;
};
var useSelectedNodesCount = function () {
    return (0, useDiagram_1.useDiagramContext)(selectSelectedNodesCount);
};
function Toolbar(_a) {
    var title = _a.title, children = _a.children, nodeProps = _a.nodeProps, props = __rest(_a, ["title", "children", "nodeProps"]);
    var selectedNodesCount = useSelectedNodesCount();
    var _b = nodeProps.selected, selected = _b === void 0 ? false : _b, _c = nodeProps.dragging, dragging = _c === void 0 ? false : _c, _d = nodeProps.data.hovered, hovered = _d === void 0 ? false : _d;
    var _isToolbarVisible = (hovered && selectedNodesCount === 0) || (selected && selectedNodesCount === 1);
    var delay = 150;
    if (_isToolbarVisible) {
        // If the node is selected, we want to show the toolbar with minimal delay
        if (selected) {
            delay = 100;
        }
        else {
            // If the node is hovered, we want to show the toolbar with a delay
            delay = 1000;
        }
    }
    else {
        // if there is another node selected, we want to hide the toolbar immediately
        if (selectedNodesCount > 0) {
            delay = 50;
        }
    }
    // TODO: This is a workaround to prevent the toolbar from flickering when the node unhovered
    var isToolbarVisible = (0, hooks_1.useDebouncedValue)(_isToolbarVisible, delay)[0];
    if (!isToolbarVisible) {
        return null;
    }
    return (<react_1.NodeToolbar isVisible={!dragging} offset={4} {...props}>
      <core_1.Paper className={(0, css_1.cx)('nodrag', 'nopan')} px={5} pb={8} pt={4} radius={'sm'} shadow="xl" 
    // Prevent event bubbling to XYFlow
    onDoubleClickCapture={xyflow_1.stopPropagation} onPointerDown={xyflow_1.stopPropagation} onClick={xyflow_1.stopPropagation} onDoubleClick={xyflow_1.stopPropagation} withBorder>
        <jsx_1.VStack gap={'2'}>
          <jsx_1.Box px={'1'}>
            <core_1.Text className={styles.toolbarTitle}>{title}</core_1.Text>
          </jsx_1.Box>
          <jsx_1.HStack gap={'1'}>
            {children}
          </jsx_1.HStack>
        </jsx_1.VStack>
      </core_1.Paper>
    </react_1.NodeToolbar>);
}
