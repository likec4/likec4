"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotationPanel = void 0;
var css_1 = require("@likec4/styles/css");
var core_1 = require("@mantine/core");
var hooks_1 = require("@mantine/hooks");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("motion/react");
var react_2 = require("react");
var remeda_1 = require("remeda");
var base_primitives_1 = require("../../../base-primitives");
var hooks_2 = require("../../../hooks");
var useDiagram_1 = require("../../../hooks/useDiagram");
var useXYFlow_1 = require("../../../hooks/useXYFlow");
var styles = require("./NotationPanel.css");
var ElementNotation = function (_a) {
    var value = _a.value;
    var title = value.title, _b = value.color, color = _b === void 0 ? 'primary' : _b, _c = value.shape, shape = _c === void 0 ? 'rectangle' : _c;
    var _d = (0, react_2.useState)(null), onlyKind = _d[0], setOnlyKind = _d[1];
    var diagram = (0, useDiagram_1.useDiagram)();
    var w = 300;
    var h = 200;
    return (<core_1.Card shadow="none" px={'xs'} py={'sm'} className={(0, css_1.cx)(styles.elementNotation)} data-likec4-color={color} onMouseEnter={function () {
            setOnlyKind(null);
            diagram.highlightNotation(value);
        }} onMouseLeave={function () {
            setOnlyKind(null);
            diagram.unhighlightNotation();
        }}>
      <core_1.Group gap={'sm'} align="stretch" wrap="nowrap">
        <core_1.Box flex={'0 0 70px'} style={{
            position: 'relative',
            width: 70,
            height: (0, remeda_1.ceil)(70 * (h / w), 0),
        }}>
          <base_primitives_1.ElementShape data={{
            shape: shape,
            width: w,
            height: h,
        }}/>
        </core_1.Box>
        <core_1.Stack gap={4} flex={1}>
          <core_1.Group gap={4} flex={'0 0 auto'}>
            {value.kinds.map(function (kind) { return (<core_1.Badge key={kind} className={(0, css_1.cx)(styles.shapeBadge)} onMouseEnter={function () {
                setOnlyKind(kind);
                diagram.highlightNotation(value, kind);
            }} onMouseLeave={function () {
                setOnlyKind(null);
                diagram.highlightNotation(value);
            }} opacity={(0, remeda_1.isNonNullish)(onlyKind) && onlyKind !== kind ? 0.25 : 1}>
                {kind}
              </core_1.Badge>); })}
          </core_1.Group>
          <core_1.Text component="div" fz={'sm'} fw={500} lh="1.25" style={{
            textWrap: 'pretty',
        }}>
            {title}
          </core_1.Text>
        </core_1.Stack>
      </core_1.Group>
    </core_1.Card>);
};
var selector = function (s) {
    var _a, _b;
    return ({
        id: s.view.id,
        notations: (_b = (_a = s.view.notation) === null || _a === void 0 ? void 0 : _a.nodes) !== null && _b !== void 0 ? _b : [],
    });
};
exports.NotationPanel = (0, react_2.memo)(function () {
    var height = (0, useXYFlow_1.useXYStore)(function (s) { return s.height; });
    var _a = (0, useDiagram_1.useDiagramContext)(selector), id = _a.id, notations = _a.notations;
    var _b = (0, hooks_1.useLocalStorage)({
        key: 'notation-webview-collapsed',
        defaultValue: true,
    }), isCollapsed = _b[0], setCollapsed = _b[1];
    var hasNotations = notations.length > 0;
    var portalProps = (0, hooks_2.useMantinePortalProps)();
    // Only show panel when the view has notations; no empty-state warning
    if (!hasNotations)
        return null;
    return (<react_1.AnimatePresence>
      {isCollapsed && (<react_1.m.div key={'collapsed'} initial={{ opacity: 0.75, translateX: '50%' }} animate={{ opacity: 1, translateX: 0 }} exit={{
                translateX: '100%',
                opacity: 0.6,
            }} className={styles.container}>
          <core_1.Tooltip label="Show notation" color="dark" fz={'xs'} {...portalProps}>
            <core_1.ActionIcon size={'lg'} variant="default" color="gray" className={styles.icon} onClick={function () { return setCollapsed(false); }}>
              <icons_react_1.IconHelpCircle stroke={1.5}/>
            </core_1.ActionIcon>
          </core_1.Tooltip>
        </react_1.m.div>)}

      {!isCollapsed && (<react_1.m.div key={id} initial={{
                opacity: 0.75,
                // translateX: '50%',
                scale: 0.2,
            }} animate={{ opacity: 1, scale: 1 }} exit={{
                opacity: 0,
                scale: 0.25,
            }} className={(0, css_1.cx)('react-flow__panel', styles.container)} style={{
                transformOrigin: 'bottom right',
            }}>
          <core_1.Paper radius="sm" withBorder shadow="lg" className={styles.card}>
            {/* <Text fz={'sm'} fw={500} c={'dimmed'} ml={'md'}>diagram notation</Text> */}
            <core_1.Tabs defaultValue="first" radius={'xs'}>
              <core_1.TabsList>
                <core_1.ActionIcon size={'md'} variant="subtle" color="gray" ml={2} style={{
                alignSelf: 'center',
            }} onClick={function () { return setCollapsed(true); }}>
                  <icons_react_1.IconArrowDownRight stroke={2}/>
                </core_1.ActionIcon>
                <core_1.TabsTab value="first" fz={'xs'}>Elements</core_1.TabsTab>
                <core_1.TabsTab value="second" fz={'xs'} disabled>
                  Relationships
                </core_1.TabsTab>
              </core_1.TabsList>

              <core_1.TabsPanel value="first" className={styles.tabPanel} hidden={isCollapsed}>
                <core_1.ScrollAreaAutosize viewportProps={{
                style: {
                    maxHeight: "min(40vh, ".concat(Math.max(height - 60, 50), "px)"),
                },
            }}>
                  <core_1.Stack gap={0}>
                    {notations.map(function (n, i) { return <ElementNotation key={i} value={n}/>; })}
                  </core_1.Stack>
                </core_1.ScrollAreaAutosize>
              </core_1.TabsPanel>
            </core_1.Tabs>
          </core_1.Paper>
        </react_1.m.div>)}
    </react_1.AnimatePresence>);
});
