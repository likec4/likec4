"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tooltip = void 0;
exports.BrowseRelationshipsButton = BrowseRelationshipsButton;
exports.GoToSourceButton = GoToSourceButton;
exports.BorderStyleOption = BorderStyleOption;
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
var context_1 = require("../../../../context");
var useDiagram_1 = require("../../../../hooks/useDiagram");
exports.Tooltip = core_1.Tooltip.withProps({
    color: 'dark',
    fz: 'xs',
    openDelay: 400,
    closeDelay: 150,
    label: '',
    children: null,
    offset: 4,
    withinPortal: false,
});
function BrowseRelationshipsButton(_a) {
    var fqn = _a.fqn;
    var diagram = (0, useDiagram_1.useDiagram)();
    return (<exports.Tooltip label={'Browse relationships'}>
      <core_1.ActionIcon size={'md'} variant="subtle" color="gray" onClick={function (e) {
            e.stopPropagation();
            diagram.openRelationshipsBrowser(fqn);
        }}>
        <icons_react_1.IconTransform stroke={2} style={{
            width: '65%',
            height: '65%',
        }}/>
      </core_1.ActionIcon>
    </exports.Tooltip>);
}
function GoToSourceButton(props) {
    var onOpenSource = (0, context_1.useDiagramEventHandlers)().onOpenSource;
    if (!onOpenSource)
        return null;
    // const diagramApi = useDiagramStoreApi()
    // const portalProps = useMantinePortalProps()
    return (<exports.Tooltip label={'Open source'}>
      <core_1.ActionIcon size={'md'} variant="subtle" color="gray" onClick={function (e) {
            e.stopPropagation();
            if (props.elementId) {
                onOpenSource === null || onOpenSource === void 0 ? void 0 : onOpenSource({
                    element: props.elementId,
                });
            }
            else if (props.deploymentId) {
                onOpenSource === null || onOpenSource === void 0 ? void 0 : onOpenSource({
                    deployment: props.deploymentId,
                });
            }
        }}>
        <icons_react_1.IconFileSymlink stroke={1.8} style={{ width: '65%' }}/>
      </core_1.ActionIcon>
    </exports.Tooltip>);
}
function BorderStyleOption(_a) {
    var _b = _a.elementBorderStyle, elementBorderStyle = _b === void 0 ? 'none' : _b, onChange = _a.onChange;
    var _c = (0, react_1.useState)(elementBorderStyle), value = _c[0], setValue = _c[1];
    (0, react_1.useEffect)(function () {
        setValue(elementBorderStyle);
    }, [elementBorderStyle]);
    return (<core_1.SegmentedControl size="xs" fz="xxs" fullWidth withItemsBorders={false} value={value} onChange={function (v) {
            var border = v;
            setValue(border);
            onChange({ border: border });
        }} styles={{
            label: {
                paddingTop: 2,
                paddingBottom: 2,
            },
        }} data={[
            { label: 'Solid', value: 'solid' },
            { label: 'Dashed', value: 'dashed' },
            { label: 'Dotted', value: 'dotted' },
            { label: 'None', value: 'none' },
        ]}/>);
}
