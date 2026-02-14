"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.TabPanelDeployments = void 0;
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
var useDiagram_1 = require("../../hooks/useDiagram");
var useLikeC4Model_1 = require("../../hooks/useLikeC4Model");
var utils_1 = require("../../utils");
var css = require("./TabPanelDeployments.css");
var DeploymentNodeRenderer = function (_a) {
    var node = _a.node;
    return (<core_1.Group className={css.nodeLabel} gap={6} align="baseline" wrap="nowrap">
    <core_1.Text component="div" fz={11} c="dimmed">{node.kind}:</core_1.Text>
    <core_1.Text component="div" fz={'sm'} fw={'500'}>{node.title}</core_1.Text>
  </core_1.Group>);
};
var zoomIcon = (<core_1.ThemeIcon size={'sm'} variant="transparent" color="gray">
    <icons_react_1.IconZoomScan stroke={1.8} opacity={0.65}/>
  </core_1.ThemeIcon>);
var DeployedInstanceRenderer = function (_a) {
    var instance = _a.instance;
    var diagram = (0, useDiagram_1.useDiagram)();
    var currentViewId = diagram.currentView.id;
    var views = __spreadArray([], instance.views(), true);
    return ((<core_1.Group className={css.instanceLabel} gap={4}>
        <core_1.ThemeIcon color="gray" variant="transparent" size={'xs'} flex={0}>
          <icons_react_1.IconTarget stroke={1.2}/>
        </core_1.ThemeIcon>
        <core_1.Text component="div" fz={'sm'} fw={'500'} flex={'1 1 100%'}>{instance.title}</core_1.Text>
        <core_1.Box onClick={utils_1.stopPropagation} pos={'relative'} data-no-transform flex={0}>
          {views.length === 0 && (<core_1.Button size="compact-xs" variant="transparent" color="gray" disabled>
              no views
            </core_1.Button>)}
          {views.length > 0 && (<core_1.Menu shadow="md" withinPortal={false} position="bottom-start" offset={0} 
        // trigger={'click-hover'}
        // openDelay={100}
        // closeDelay={200}
        closeOnClickOutside clickOutsideEvents={['pointerdown', 'mousedown', 'click']} closeOnEscape trapFocus>
              <core_1.Menu.Target>
                <core_1.Button size="compact-xs" variant="subtle" color="gray">
                  {views.length} view{views.length > 1 ? 's' : ''}
                </core_1.Button>
              </core_1.Menu.Target>

              <core_1.Menu.Dropdown>
                {views.map(function (view) { return (<core_1.Menu.Item key={view.id} px={'xs'} py={4} disabled={view.id === currentViewId} leftSection={zoomIcon} styles={{
                    itemSection: {
                        marginInlineEnd: (0, core_1.rem)(8),
                    },
                }} onClick={function (e) {
                    e.stopPropagation();
                    diagram.navigateTo(view.id);
                }}>
                    {view.title}
                  </core_1.Menu.Item>); })}
              </core_1.Menu.Dropdown>
            </core_1.Menu>)}
        </core_1.Box>
      </core_1.Group>));
};
var infoIcon = <icons_react_1.IconInfoCircle />;
var setHoveredNode = function () { };
exports.TabPanelDeployments = (0, react_1.memo)(function (_a) {
    var elementFqn = _a.elementFqn;
    var element = (0, useLikeC4Model_1.useLikeC4Model)().element(elementFqn);
    var deployments = __spreadArray([], element.deployments(), true);
    var tree = (0, core_1.useTree)({
        multiple: false,
    });
    tree.setHoveredNode = setHoveredNode;
    var data = (0, react_1.useMemo)(function () {
        var roots = [];
        var treeItems = new Map();
        for (var _i = 0, _a = element.deployments(); _i < _a.length; _i++) {
            var instance = _a[_i];
            var instanceNode = {
                label: <DeployedInstanceRenderer instance={instance}/>,
                value: instance.id,
                type: 'instance',
                children: [],
            };
            treeItems.set(instance.id, instanceNode);
            var ancestor = instance.parent;
            while (ancestor) {
                var ancestorNode = treeItems.get(ancestor.id);
                if (ancestorNode) {
                    ancestorNode.children.push(instanceNode);
                    break;
                }
                ancestorNode = {
                    label: <DeploymentNodeRenderer node={ancestor}/>,
                    value: ancestor.id,
                    type: 'node',
                    children: [instanceNode],
                };
                treeItems.set(ancestor.id, ancestorNode);
                instanceNode = ancestorNode;
                ancestor = ancestor.parent;
            }
            if (!ancestor && !roots.includes(instanceNode)) {
                roots.push(instanceNode);
            }
        }
        return roots;
    }, [element]);
    (0, react_1.useEffect)(function () {
        tree.expandAllNodes();
    }, [data]);
    if (deployments.length === 0) {
        return (<core_1.Alert variant="light" color="gray" icon={infoIcon}>
        This element does not have any deployments
      </core_1.Alert>);
    }
    return (
    // <Box></Box>
    <core_1.Tree levelOffset={'sm'} allowRangeSelection={false} classNames={{
            node: css.treeNode,
            label: css.treeNodeLabel,
        }} styles={{
            root: {
                position: 'relative',
                width: 'min-content',
                minWidth: 300,
            },
        }} data={data} tree={tree} renderNode={function (_a) {
            var node = _a.node, selected = _a.selected, elementProps = _a.elementProps, hasChildren = _a.hasChildren;
            return (<core_1.Box {...elementProps} style={__assign({}, (!hasChildren && {
                    marginBottom: (0, core_1.rem)(4),
                }))}>
          {hasChildren
                    ? (<core_1.Button fullWidth color={'gray'} variant={selected ? 'transparent' : 'subtle'} size="xs" justify="flex-start" styles={{
                            root: {
                                position: 'unset',
                                paddingInlineStart: (0, core_1.rem)(16),
                            },
                        }}>
                {node.label}
              </core_1.Button>)
                    : node.label}
        </core_1.Box>);
        }}/>);
});
