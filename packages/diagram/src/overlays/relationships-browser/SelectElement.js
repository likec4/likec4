"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectElement = void 0;
var core_1 = require("@likec4/core");
var core_2 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
var useLikeC4ElementsTree_1 = require("../../hooks/useLikeC4ElementsTree");
var useLikeC4Model_1 = require("../../hooks/useLikeC4Model");
var hooks_1 = require("./hooks");
var classes = require("./SelectElement.css");
var selector2 = function (state) {
    var _a, _b;
    var subjectExistsInScope = (_b = (_a = state.context.layouted) === null || _a === void 0 ? void 0 : _a.subjectExistsInScope) !== null && _b !== void 0 ? _b : false;
    return ({
        subjectId: state.context.subject,
        viewId: state.context.viewId,
        scope: state.context.scope,
        subjectExistsInScope: subjectExistsInScope,
        enableSelectSubject: state.context.enableSelectSubject,
        enableChangeScope: state.context.enableChangeScope,
    });
};
var setHoveredNode = function () { };
exports.SelectElement = (0, react_1.memo)(function () {
    var _a;
    var browser = (0, hooks_1.useRelationshipsBrowser)();
    var _b = (0, hooks_1.useRelationshipsBrowserState)(selector2), subjectId = _b.subjectId, viewId = _b.viewId, scope = _b.scope, subjectExistsInScope = _b.subjectExistsInScope, enableSelectSubject = _b.enableSelectSubject, enableChangeScope = _b.enableChangeScope;
    var root = (0, react_1.useRef)(null);
    var viewport = (0, react_1.useRef)(null);
    var model = (0, useLikeC4Model_1.useLikeC4Model)();
    var subject = model.findElement(subjectId);
    var data = (0, useLikeC4ElementsTree_1.useLikeC4ElementsTree)(scope === 'view' && viewId ? viewId : undefined);
    var tree = (0, core_2.useTree)({
        multiple: false,
    });
    tree.setHoveredNode = setHoveredNode;
    (0, react_1.useEffect)(function () {
        (0, core_1.ancestorsFqn)(subjectId).reverse().forEach(function (id) {
            tree.expand(id);
        });
        tree.select(subjectId);
    }, [subjectId]);
    return (<core_2.Group ref={root} gap={'xs'} pos={'relative'}>
      {enableSelectSubject && (<core_2.Group gap={4} wrap="nowrap">
          <core_2.Box fz={'xs'} fw={'500'} style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>
            Relationships of
          </core_2.Box>
          <core_2.Box pos={'relative'}>
            <core_2.Popover position="bottom-start" shadow="md" keepMounted={false} withinPortal={false} closeOnClickOutside clickOutsideEvents={['pointerdown', 'mousedown', 'click']} offset={4} onOpen={function () {
                setTimeout(function () {
                    var _a;
                    var item = (_a = viewport.current) === null || _a === void 0 ? void 0 : _a.querySelector("[data-value=\"".concat(subjectId, "\"]"));
                    item === null || item === void 0 ? void 0 : item.scrollIntoView({ behavior: 'instant', block: 'nearest' });
                }, 100);
            }}>
              <core_2.PopoverTarget>
                <core_2.Button size="xs" variant="default" maw={250} rightSection={<icons_react_1.IconSelector size={16}/>}>
                  <core_2.Text fz={'xs'} fw={'500'} truncate>
                    {(_a = subject === null || subject === void 0 ? void 0 : subject.title) !== null && _a !== void 0 ? _a : '???'}
                  </core_2.Text>
                </core_2.Button>
              </core_2.PopoverTarget>
              <core_2.PopoverDropdown p={0} miw={250} maw={400}>
                <core_2.ScrollAreaAutosize scrollbars="y" type="never" viewportRef={viewport} className={classes.scrollArea}>
                  <core_2.Tree allowRangeSelection={false} selectOnClick={false} tree={tree} data={data} classNames={classes} levelOffset={8} styles={{
                root: {
                    maxWidth: 400,
                    overflow: 'hidden',
                },
                label: {
                    paddingTop: 5,
                    paddingBottom: 6,
                },
            }} renderNode={function (_a) {
                var node = _a.node, selected = _a.selected, expanded = _a.expanded, elementProps = _a.elementProps, hasChildren = _a.hasChildren;
                return (<core_2.Group gap={2} wrap="nowrap" {...elementProps} py="3">
                        <core_2.ActionIcon variant="subtle" size={18} 
                // color={theme === 'light' ? 'gray' : 'gray'}
                c={'dimmed'} style={{
                        visibility: hasChildren ? 'visible' : 'hidden',
                    }}>
                          <icons_react_1.IconChevronRight stroke={3.5} style={{
                        transition: 'transform 150ms ease',
                        transform: "rotate(".concat(expanded ? '90deg' : '0', ")"),
                        width: '80%',
                    }}/>
                        </core_2.ActionIcon>
                        <core_2.Box flex={'1 1 100%'} w={'100%'} 
                // gap={3}
                onClick={function (e) {
                        e.stopPropagation();
                        tree.select(node.value);
                        tree.expand(node.value);
                        browser.navigateTo(node.value);
                    }}>
                          <core_2.Text fz="sm" fw={selected ? '600' : '400'} truncate="end">
                            {node.label}
                          </core_2.Text>
                        </core_2.Box>
                      </core_2.Group>);
            }}/>
                </core_2.ScrollAreaAutosize>
              </core_2.PopoverDropdown>
            </core_2.Popover>
          </core_2.Box>
        </core_2.Group>)}
      {enableChangeScope && (<core_2.Group gap={4} wrap="nowrap">
          {/* Show if only "select" is enabled  */}
          {enableSelectSubject && (<core_2.Box fz={'xs'} fw={'500'} {...!subjectExistsInScope && {
                c: 'dimmed',
            }} style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>
              Scope
            </core_2.Box>)}
          <div>
            <core_2.Tooltip color="orange" label={<>
                  This element does not exist in the current view
                  {scope === 'view' && (<>
                      <br />
                      {'Scope is set to global'}
                    </>)}
                </>} position="bottom-start" disabled={subjectExistsInScope} portalProps={{
                target: root.current,
            }}>
              <core_2.SegmentedControl flex={'1 0 auto'} size="xs" withItemsBorders={false} value={scope} styles={{
                label: {
                    paddingLeft: 8,
                    paddingRight: 8,
                },
            }} onChange={function (value) {
                browser.changeScope(value);
            }} data={[
                { label: 'Global', value: 'global' },
                {
                    label: <span>Current view</span>,
                    value: 'view',
                    disabled: !subjectExistsInScope,
                },
            ]}/>
            </core_2.Tooltip>
          </div>
        </core_2.Group>)}
    </core_2.Group>);
});
