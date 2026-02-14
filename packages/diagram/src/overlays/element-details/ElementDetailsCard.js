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
exports.ElementDetailsCard = ElementDetailsCard;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var hooks_1 = require("@mantine/hooks");
var web_1 = require("@react-hookz/web");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("motion/react");
var react_2 = require("react");
var remeda_1 = require("remeda");
var base_primitives_1 = require("../../base-primitives");
var ElementTags_1 = require("../../base-primitives/element/ElementTags");
var Link_1 = require("../../components/Link");
var context_1 = require("../../context");
var hooks_2 = require("../../hooks");
var useCurrentViewModel_1 = require("../../hooks/useCurrentViewModel");
var useDiagram_1 = require("../../hooks/useDiagram");
var utils_1 = require("../../utils");
var styles = require("./ElementDetailsCard.css");
var MetadataValue_1 = require("./MetadataValue");
var TabPanelDeployments_1 = require("./TabPanelDeployments");
var TabPanelRelationships_1 = require("./TabPanelRelationships");
var TabPanelStructure_1 = require("./TabPanelStructure");
var Divider = core_1.Divider.withProps({
    mb: 8,
    labelPosition: 'left',
    variant: 'dashed',
});
var Tooltip = core_1.Tooltip.withProps({
    color: 'dark',
    fz: 'xs',
    openDelay: 400,
    closeDelay: 150,
    label: '',
    children: null,
    offset: 4,
});
var SmallLabel = core_1.Text.withProps({
    component: 'div',
    fz: 11,
    fw: 500,
    c: 'dimmed',
    lh: 1,
});
var PropertyLabel = core_1.Text.withProps({
    component: 'div',
    fz: 'xs',
    c: 'dimmed',
    className: styles.propertyLabel,
});
var MIN_PADDING = 24;
var TABS = ['Properties', 'Relationships', 'Views', 'Structure', 'Deployments'];
function ElementDetailsCard(_a) {
    var _b, _c, _d;
    var _e, _f, _g, _h, _j, _k, _l, _m, _o;
    var viewId = _a.viewId, fromNode = _a.fromNode, rectFromNode = _a.rectFromNode, fqn = _a.fqn, onClose = _a.onClose;
    var _p = (0, react_2.useState)(false), opened = _p[0], setOpened = _p[1];
    var windowSize = (0, hooks_1.useViewportSize)();
    var windowWidth = windowSize.width || window.innerWidth || 1200, windowHeight = windowSize.height || window.innerHeight || 800;
    var _q = (0, hooks_1.useSessionStorage)({
        key: "likec4:element-details:active-tab",
        defaultValue: 'Properties',
    }), activeTab = _q[0], setActiveTab = _q[1];
    var diagram = (0, useDiagram_1.useDiagram)();
    var viewModel = (0, useCurrentViewModel_1.useCurrentViewModel)();
    var nodeModel = fromNode ? viewModel.findNode(fromNode) : viewModel.findNodeWithElement(fqn);
    var elementModel = viewModel.$model.element(fqn);
    var _r = (0, remeda_1.pipe)(__spreadArray([], elementModel.views(), true), (0, remeda_1.map)(function (v) { return v.$view; }), (0, remeda_1.partition)(function (v) { return v._type === 'element' && v.viewOf === fqn; })), viewsOf = _r[0], otherViews = _r[1];
    var defaultView = (_h = (_f = (_e = nodeModel === null || nodeModel === void 0 ? void 0 : nodeModel.navigateTo) === null || _e === void 0 ? void 0 : _e.$view) !== null && _f !== void 0 ? _f : (_g = elementModel.defaultView) === null || _g === void 0 ? void 0 : _g.$view) !== null && _h !== void 0 ? _h : null;
    // Ignore default view if it's the current view
    if ((defaultView === null || defaultView === void 0 ? void 0 : defaultView.id) === viewId) {
        defaultView = null;
    }
    var defaultLink = (0, remeda_1.only)(elementModel.links);
    var controls = (0, react_1.useDragControls)();
    var isCompound = ((_k = (_j = nodeModel === null || nodeModel === void 0 ? void 0 : nodeModel.$node.children) === null || _j === void 0 ? void 0 : _j.length) !== null && _k !== void 0 ? _k : 0) > 0;
    var _width = Math.min(700, windowWidth - MIN_PADDING * 2);
    var _height = Math.min(650, windowHeight - MIN_PADDING * 2);
    var fromPositon = rectFromNode
        ? {
            x: rectFromNode.x + (isCompound ? (rectFromNode.width - _width / 2) : rectFromNode.width / 2),
            y: rectFromNode.y + (isCompound ? 0 : rectFromNode.height / 2),
        }
        : {
            x: windowWidth / 2,
            y: windowHeight / 2,
        };
    var fromScale = rectFromNode ? Math.min(rectFromNode.width / _width, rectFromNode.height / _height, 0.9) : 1;
    var left = Math.round((0, remeda_1.clamp)(fromPositon.x - _width / 2, {
        min: MIN_PADDING,
        max: windowWidth - _width - MIN_PADDING,
    }));
    var top = Math.round((0, remeda_1.clamp)(fromPositon.y - (isCompound ? 0 : 60), {
        min: MIN_PADDING,
        max: windowHeight - _height - MIN_PADDING,
    }));
    var originX = (0, remeda_1.clamp)((fromPositon.x - left) / _width, {
        min: 0.1,
        max: 0.9,
    });
    var originY = (0, remeda_1.clamp)((fromPositon.y - top) / _height, {
        min: 0.1,
        max: 0.9,
    });
    var width = (0, react_1.useMotionValue)(_width);
    var height = (0, react_1.useMotionValue)(_height);
    (0, hooks_2.useUpdateEffect)(function () {
        width.set(_width);
        height.set(_height);
    }, [_width, _height]);
    var handleDrag = (0, react_2.useCallback)(function (_, info) {
        width.set(Math.max(width.get() + info.delta.x, 320));
        height.set(Math.max(height.get() + info.delta.y, 300));
    }, [width, height]);
    var ref = (0, react_2.useRef)(null);
    var close = (0, web_1.useDebouncedCallback)((0, hooks_2.useCallbackRef)(onClose), [], 50);
    var triggerClose = (0, hooks_2.useCallbackRef)(function (event) {
        event === null || event === void 0 ? void 0 : event.stopPropagation();
        close();
    });
    var notation = (_l = nodeModel === null || nodeModel === void 0 ? void 0 : nodeModel.$node.notation) !== null && _l !== void 0 ? _l : null;
    var elementIcon = (0, context_1.IconRenderer)({
        element: {
            id: fqn,
            title: elementModel.title,
            icon: (_m = nodeModel === null || nodeModel === void 0 ? void 0 : nodeModel.icon) !== null && _m !== void 0 ? _m : elementModel.icon,
        },
        className: styles.elementIcon,
    });
    (0, web_1.useTimeoutEffect)(function () {
        var _a, _b;
        if (!((_a = ref.current) === null || _a === void 0 ? void 0 : _a.open)) {
            (_b = ref.current) === null || _b === void 0 ? void 0 : _b.showModal();
        }
    }, 20);
    /**
     * This delay improves "enter" animations,
     * if  current tab is "Relationships"
     */
    (0, web_1.useTimeoutEffect)(function () {
        setOpened(true);
    }, 220);
    return (<react_1.m.dialog ref={ref} className={(0, css_1.cx)(styles.dialog, core_1.RemoveScroll.classNames.fullWidth)} layout initial={_b = {},
            _b[styles.backdropBlur] = '0px',
            _b[styles.backdropOpacity] = '5%',
            _b} animate={_c = {},
            _c[styles.backdropBlur] = '3px',
            _c[styles.backdropOpacity] = '60%',
            _c} exit={_d = {},
            _d[styles.backdropBlur] = '0px',
            _d[styles.backdropOpacity] = '0%',
            _d.transition = {
                duration: 0.1,
            },
            _d} onClick={function (e) {
            var _a, _b, _c;
            e.stopPropagation();
            if (((_b = (_a = e.target) === null || _a === void 0 ? void 0 : _a.nodeName) === null || _b === void 0 ? void 0 : _b.toUpperCase()) === 'DIALOG') {
                (_c = ref.current) === null || _c === void 0 ? void 0 : _c.close();
            }
        }} onDoubleClick={utils_1.stopPropagation} onPointerDown={utils_1.stopPropagation} onClose={triggerClose}>
      <core_1.RemoveScroll forwardProps removeScrollBar={false}>
        <react_1.m.div layout layoutRoot drag dragControls={controls} dragElastic={0} dragMomentum={false} dragListener={false} data-likec4-color={(_o = nodeModel === null || nodeModel === void 0 ? void 0 : nodeModel.color) !== null && _o !== void 0 ? _o : elementModel.color} className={styles.card} initial={{
            top: top,
            left: left,
            width: _width,
            height: _height,
            opacity: 0,
            originX: originX,
            originY: originY,
            scale: Math.max(fromScale, 0.65),
        }} animate={{
            opacity: 1,
            scale: 1,
        }} exit={{
            opacity: 0,
            scale: 0.9,
            translateY: -10,
            transition: {
                duration: 0.1,
            },
        }} style={{
            width: width,
            height: height,
        }}>
          <div className={styles.cardHeader} onPointerDown={function (e) { return controls.start(e); }}>
            <jsx_1.HStack alignItems="start" justify="space-between" gap={'sm'} mb={'sm'} flexWrap="nowrap">
              <jsx_1.HStack alignItems="start" gap={'sm'} style={{ cursor: 'default' }} flexWrap="nowrap">
                {elementIcon}
                <div>
                  <core_1.Text component={'div'} className={styles.title}>
                    {elementModel.title}
                  </core_1.Text>
                  {notation && (<core_1.Text component="div" c={'dimmed'} fz={'sm'} fw={500} lh={1.3} lineClamp={1}>
                      {notation}
                    </core_1.Text>)}
                </div>
              </jsx_1.HStack>
              <core_1.CloseButton size={'lg'} onClick={triggerClose}/>
            </jsx_1.HStack>
            <jsx_1.HStack alignItems="baseline" gap={'sm'} flexWrap="nowrap">
              <div>
                <SmallLabel>kind</SmallLabel>
                <core_1.Badge radius={'sm'} size="sm" fw={600} color="gray" style={{
            cursor: 'pointer',
        }} onClick={function (e) {
            e.stopPropagation();
            diagram.openSearch("kind:".concat(elementModel.kind));
        }}>
                  {elementModel.kind}
                </core_1.Badge>
              </div>
              <div style={{ flex: 1 }}>
                <SmallLabel>tags</SmallLabel>
                <ElementTags tags={elementModel.tags} onClick={function (tag) { return diagram.openSearch("#".concat(tag)); }}/>
              </div>
              <core_1.ActionIconGroup style={{
            alignSelf: 'flex-start',
        }}>
                {defaultLink && (<core_1.ActionIcon component="a" href={defaultLink.url} target="_blank" size="lg" variant="default" radius="sm">
                    <icons_react_1.IconExternalLink stroke={1.6} style={{ width: '65%' }}/>
                  </core_1.ActionIcon>)}
                <context_1.IfEnabled feature="Vscode">
                  <Tooltip label="Open source">
                    <core_1.ActionIcon size="lg" variant="default" radius="sm" onClick={function (e) {
            e.stopPropagation();
            diagram.openSource({
                element: elementModel.id,
            });
        }}>
                      <icons_react_1.IconFileSymlink stroke={1.8} style={{ width: '62%' }}/>
                    </core_1.ActionIcon>
                  </Tooltip>
                </context_1.IfEnabled>
                {defaultView && (<Tooltip label="Open default view">
                    <core_1.ActionIcon size="lg" variant="default" radius="sm" onClick={function (e) {
                e.stopPropagation();
                diagram.navigateTo(defaultView.id, fromNode !== null && fromNode !== void 0 ? fromNode : undefined);
            }}>
                      <icons_react_1.IconZoomScan style={{ width: '70%' }}/>
                    </core_1.ActionIcon>
                  </Tooltip>)}
              </core_1.ActionIconGroup>
            </jsx_1.HStack>
          </div>
          <MetadataValue_1.MetadataProvider>
            <core_1.Tabs value={activeTab} onChange={function (v) { return setActiveTab(v); }} variant="none" classNames={{
            root: styles.tabsRoot,
            list: styles.tabsList,
            tab: styles.tabsTab,
            panel: styles.tabsPanel,
        }}>
              <core_1.TabsList>
                {TABS.map(function (tab) { return (<core_1.TabsTab key={tab} value={tab}>
                    {tab}
                  </core_1.TabsTab>); })}
              </core_1.TabsList>

              <core_1.TabsPanel value="Properties">
                <core_1.ScrollArea scrollbars="y" type="scroll" offsetScrollbars>
                  <core_1.Box className={styles.propertiesGrid} pt={'xs'}>
                    {elementModel.hasSummary && (<>
                        <PropertyLabel>summary</PropertyLabel>
                        <base_primitives_1.Markdown value={elementModel.summary}/>
                      </>)}
                    <>
                      <PropertyLabel>description</PropertyLabel>
                      <base_primitives_1.Markdown value={elementModel.description} emptyText="no description"/>
                    </>
                    {elementModel.technology && (<ElementProperty title="technology">
                        {elementModel.technology}
                      </ElementProperty>)}
                    {elementModel.links.length > 0 && (<>
                        <PropertyLabel>links</PropertyLabel>
                        <jsx_1.HStack gap={'xs'} flexWrap="wrap">
                          {elementModel.links.map(function (link, i) { return <Link_1.Link key={i} value={link}/>; })}
                        </jsx_1.HStack>
                      </>)}
                    {elementModel.$element.metadata && <ElementMetata value={elementModel.$element.metadata}/>}
                  </core_1.Box>
                </core_1.ScrollArea>
              </core_1.TabsPanel>

              <core_1.TabsPanel value="Relationships">
                <context_1.DiagramFeatures overrides={{
            enableRelationshipBrowser: false,
            enableNavigateTo: false,
        }}>
                  {opened && activeTab === 'Relationships' && (<TabPanelRelationships_1.TabPanelRelationships element={elementModel} node={nodeModel !== null && nodeModel !== void 0 ? nodeModel : null}/>)}
                </context_1.DiagramFeatures>
              </core_1.TabsPanel>

              <core_1.TabsPanel value="Views">
                <core_1.ScrollArea scrollbars="y" type="auto">
                  <core_1.Stack gap={'lg'}>
                    {viewsOf.length > 0 && (<core_1.Box>
                        <Divider label="views of the element (scoped)"/>
                        <core_1.Stack gap={'sm'}>
                          {viewsOf.map(function (view) { return (<ViewButton key={view.id} view={view} onNavigateTo={function (to) { return diagram.navigateTo(to, fromNode !== null && fromNode !== void 0 ? fromNode : undefined); }}/>); })}
                        </core_1.Stack>
                      </core_1.Box>)}
                    {otherViews.length > 0 && (<core_1.Box>
                        <Divider label="views including this element"/>
                        <core_1.Stack gap={'sm'}>
                          {otherViews.map(function (view) { return (<ViewButton key={view.id} view={view} onNavigateTo={function (to) { return diagram.navigateTo(to, fromNode !== null && fromNode !== void 0 ? fromNode : undefined); }}/>); })}
                        </core_1.Stack>
                      </core_1.Box>)}
                  </core_1.Stack>
                </core_1.ScrollArea>
              </core_1.TabsPanel>

              <core_1.TabsPanel value="Structure">
                <core_1.ScrollArea scrollbars="y" type="auto">
                  <TabPanelStructure_1.TabPanelStructure element={elementModel}/>
                </core_1.ScrollArea>
              </core_1.TabsPanel>

              <core_1.TabsPanel value="Deployments">
                <core_1.ScrollArea scrollbars="y" type="auto">
                  <TabPanelDeployments_1.TabPanelDeployments elementFqn={elementModel.id}/>
                </core_1.ScrollArea>
              </core_1.TabsPanel>
            </core_1.Tabs>
          </MetadataValue_1.MetadataProvider>
          <react_1.m.div className={styles.resizeHandle} drag dragElastic={0} dragMomentum={false} onDrag={handleDrag} dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}/>
        </react_1.m.div>
      </core_1.RemoveScroll>
    </react_1.m.dialog>);
}
var ViewButton = function (_a) {
    var view = _a.view, onNavigateTo = _a.onNavigateTo;
    return (<core_1.UnstyledButton className={styles.viewButton} onClick={function (e) { return onNavigateTo(view.id, e); }}>
      <core_1.Group gap={6} align="start" wrap="nowrap">
        <core_1.ThemeIcon size={'sm'} variant="transparent">
          {view._type === 'deployment'
            ? <icons_react_1.IconStack2 stroke={1.8}/>
            : <icons_react_1.IconZoomScan stroke={1.8}/>}
        </core_1.ThemeIcon>
        <core_1.Box>
          <core_1.Text component="div" className={styles.viewButtonTitle} lineClamp={1}>
            {view.title || 'untitled'}
          </core_1.Text>
          {
        /* {view.description && (
        <Text component="div" mt={2} fz={'xs'} c={'dimmed'} lh={1.4} lineClamp={1}>
          {view.description}
        </Text>
      )} */
        }
        </core_1.Box>
      </core_1.Group>
    </core_1.UnstyledButton>);
};
function ElementProperty(_a) {
    var title = _a.title, _b = _a.emptyValue, emptyValue = _b === void 0 ? "undefined" : _b, children = _a.children, style = _a.style, props = __rest(_a, ["title", "emptyValue", "children", "style"]);
    return (<>
      <PropertyLabel>{title}</PropertyLabel>
      <core_1.Text component="div" {...((0, remeda_1.isNullish)(children) && { c: 'dimmed' })} fz={'md'} style={__assign({ whiteSpace: 'preserve-breaks', userSelect: 'all' }, style)} {...props}>
        {children || emptyValue}
      </core_1.Text>
    </>);
}
function ElementMetata(_a) {
    var metadata = _a.value;
    var metadataEntries = (0, remeda_1.entries)(metadata).sort(function (_a, _b) {
        var a = _a[0];
        var b = _b[0];
        return a.localeCompare(b);
    });
    return (<MetadataValue_1.MetadataProvider>
      <>
        <PropertyLabel style={{ justifySelf: 'end', textAlign: 'right' }}>metadata</PropertyLabel>
        <core_1.Box className={(0, css_1.css)({
            display: 'grid',
            gridTemplateColumns: 'min-content 1fr',
            gridAutoRows: 'min-content',
            gap: "[12px 16px]",
            alignItems: 'baseline',
            justifyItems: 'stretch',
        })}>
          {metadataEntries.map(function (_a) {
        var key = _a[0], value = _a[1];
        return <MetadataValue_1.MetadataValue key={key} label={key} value={value}/>;
    })}
        </core_1.Box>
      </>
    </MetadataValue_1.MetadataProvider>);
}
function ElementTags(_a) {
    var tags = _a.tags, onClick = _a.onClick;
    return (<core_1.Flex gap={4} flex={1} mt={6} wrap="wrap">
      {tags.map(function (tag) { return (<ElementTags_1.ElementTag key={tag} tag={tag} cursor="pointer" onClick={function (e) {
                e.stopPropagation();
                onClick(tag);
            }}/>); })}
      {tags.length === 0 && <core_1.Badge radius={'sm'} size="sm" fw={600} color="gray">—</core_1.Badge>}
    </core_1.Flex>);
}
