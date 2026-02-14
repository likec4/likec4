"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementLabel = void 0;
exports.TabPanelStructure = TabPanelStructure;
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
var css = require("./TabPanelStructure.css");
var ElementLabel = function (_a) {
    var element = _a.element;
    return (<core_1.Box className={css.elementLabel}>
    <core_1.Text component="div" fz={'sm'} fw={'500'}>{element.title}</core_1.Text>
  </core_1.Box>);
};
exports.ElementLabel = ElementLabel;
// const Render = ({
//   node
// }: RenderTreeNodePayload) => {
// }
var infoIcon = <icons_react_1.IconInfoCircle />;
var setHoveredNode = function () { };
function TabPanelStructure(_a) {
    var element = _a.element;
    var tree = (0, core_1.useTree)({
        multiple: false,
    });
    tree.setHoveredNode = setHoveredNode;
    var data = (0, react_1.useMemo)(function () {
        var seq = 1;
        var messageNode = function (label) { return ({
            label: label,
            value: "msg".concat(seq++),
            type: 'message',
            children: [],
        }); };
        var current = {
            label: <exports.ElementLabel type="current" element={element}/>,
            value: element.id,
            element: element,
            type: 'current',
            children: __spreadArray([], element.children(), true).map(function (child) { return ({
                label: <exports.ElementLabel type="descedant" element={child}/>,
                value: child.id,
                element: child,
                type: 'descedant',
                children: [],
            }); }),
        };
        if (current.children.length === 0) {
            current.children.push(messageNode(<core_1.Pill radius={'sm'}>no nested</core_1.Pill>));
        }
        var ancestor = __spreadArray([], element.ancestors(), true).reduce(function (acc, parent) { return ({
            label: <exports.ElementLabel type="ancestor" element={parent}/>,
            value: parent.id,
            element: parent,
            type: 'ancestor',
            children: [acc],
        }); }, current);
        return [
            ancestor,
        ];
    }, [element]);
    (0, react_1.useEffect)(function () {
        tree.expandAllNodes();
    }, [data]);
    return (<>
      <core_1.Alert variant="light" color="orange" title="In development" icon={infoIcon}>
        We need your feedback. Share your thoughts and ideas -{' '}
        <core_1.Anchor fz="sm" fw={500} underline="hover" c={'orange'} href="https://github.com/likec4/likec4/discussions/" target="_blank">
          GitHub discussions
        </core_1.Anchor>
      </core_1.Alert>
      <core_1.Tree levelOffset={'xl'} allowRangeSelection={false} expandOnClick={false} expandOnSpace={false} classNames={{
            label: css.treeNodeLabel,
        }} data={data} tree={tree}/>
    </>);
}
