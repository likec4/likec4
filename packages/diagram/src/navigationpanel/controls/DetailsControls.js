"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetailsControls = void 0;
var model_1 = require("@likec4/core/model");
var types_1 = require("@likec4/core/types");
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var patterns_1 = require("@likec4/styles/patterns");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var fast_equals_1 = require("fast-equals");
var m = require("motion/react-m");
var react_1 = require("react");
var base_primitives_1 = require("../../base-primitives");
var Link_1 = require("../../components/Link");
var useDiagram_1 = require("../../hooks/useDiagram");
var useMantinePortalProps_1 = require("../../hooks/useMantinePortalProps");
var hooks_1 = require("../hooks");
var selector = function (_a) {
    var _b, _c, _d, _e, _f, _g, _h;
    var context = _a.context;
    var view = context.view;
    return {
        id: view.id,
        title: (_d = (_c = (_b = context.viewModel) === null || _b === void 0 ? void 0 : _b.title) !== null && _c !== void 0 ? _c : (view.title && (0, model_1.extractViewTitleFromPath)(view.title))) !== null && _d !== void 0 ? _d : 'Untitled View',
        description: (_f = (_e = context.viewModel) === null || _e === void 0 ? void 0 : _e.description) !== null && _f !== void 0 ? _f : types_1.RichText.from(view.description),
        tags: (_g = view.tags) !== null && _g !== void 0 ? _g : [],
        links: (_h = view.links) !== null && _h !== void 0 ? _h : [],
    };
};
var DetailsControls = function (props) {
    var _a = (0, react_1.useState)(false), opened = _a[0], setOpened = _a[1];
    var data = (0, hooks_1.useNavigationActorSnapshot)(selector, fast_equals_1.deepEqual);
    var portalProps = (0, useMantinePortalProps_1.useMantinePortalProps)();
    return (<core_1.Popover position="bottom-end" shadow="xl" clickOutsideEvents={['pointerdown', 'mousedown', 'click']} offset={{
            mainAxis: 4,
        }} opened={opened} onChange={setOpened} {...portalProps} {...props}>
      <ViewDetailsCardTrigger linksCount={data.links.length} onOpen={function () { return setOpened(true); }}/>
      {opened && <ViewDetailsCardDropdown data={data} onClose={function () { return setOpened(false); }}/>}
    </core_1.Popover>);
};
exports.DetailsControls = DetailsControls;
var ViewDetailsCardTrigger = function (_a) {
    var linksCount = _a.linksCount, onOpen = _a.onOpen;
    return (<core_1.Popover.Target>
    <core_1.UnstyledButton component={m.button} layout="position" whileTap={{
            scale: 0.95,
            translateY: 1,
        }} onClick={function (e) {
            e.stopPropagation();
            onOpen();
        }} className={(0, css_1.cx)('group', (0, patterns_1.hstack)({
            gap: '2',
            paddingInline: '2',
            paddingBlock: '1',
            rounded: 'sm',
            userSelect: 'none',
            cursor: 'pointer',
            color: {
                base: 'likec4.panel.action',
                _hover: 'likec4.panel.action.hover',
            },
            backgroundColor: {
                _hover: 'likec4.panel.action.bg.hover',
            },
            display: {
                base: 'none',
                '@/xs': 'flex',
            },
        }), "")}>
      <icons_react_1.IconId size={16} stroke={1.8}/>
      {linksCount > 0 && (<jsx_1.HStack gap={'[1px]'}>
          <icons_react_1.IconLink size={14} stroke={2}/>
          <jsx_1.Box css={{
                fontSize: '11px',
                fontWeight: 'bold',
                lineHeight: 1,
                opacity: 0.8,
            }}>
            {linksCount}
          </jsx_1.Box>
        </jsx_1.HStack>)}
    </core_1.UnstyledButton>
  </core_1.Popover.Target>);
};
var SectionHeader = (0, jsx_1.styled)('div', {
    base: {
        fontSize: 'xs',
        color: 'text.dimmed',
        fontWeight: 'medium',
        userSelect: 'none',
        mb: 'xxs',
    },
});
var ViewDetailsCardDropdown = function (_a) {
    var _b = _a.data, id = _b.id, title = _b.title, description = _b.description, tags = _b.tags, links = _b.links, onClose = _a.onClose;
    var diagram = (0, useDiagram_1.useDiagram)();
    (0, useDiagram_1.useOnDiagramEvent)('paneClick', onClose);
    (0, useDiagram_1.useOnDiagramEvent)('nodeClick', onClose);
    return (<core_1.Popover.Dropdown className={(0, css_1.cx)('nowheel nopan nodrag', (0, patterns_1.vstack)({
            margin: 'xs',
            layerStyle: 'likec4.dropdown',
            gap: 'md',
            padding: 'md',
            paddingBottom: 'lg',
            pointerEvents: 'all',
            maxWidth: 'calc(100cqw - 52px)',
            minWidth: '200px',
            maxHeight: 'calc(100cqh - 100px)',
            width: 'max-content',
            cursor: 'default',
            overflow: 'auto',
            overscrollBehavior: 'contain',
            '@/sm': {
                minWidth: 400,
                maxWidth: 550,
            },
            '@/lg': {
                maxWidth: 700,
            },
        }))}>
      <section>
        <core_1.Text component="div" fw={500} size="xl" lh={'sm'}>{title}</core_1.Text>
        <jsx_1.HStack alignItems={'flex-start'} mt="1">
          <ViewBadge label="id" value={id}/>
          <jsx_1.HStack gap="xs" flexWrap="wrap">
            {tags.map(function (tag) { return (<base_primitives_1.ElementTag key={tag} tag={tag} cursor="pointer" onClick={function (e) {
                e.stopPropagation();
                diagram.openSearch("#".concat(tag));
            }}/>); })}
          </jsx_1.HStack>
        </jsx_1.HStack>
      </section>
      {links.length > 0 && (<section className={(0, patterns_1.hstack)({ alignItems: 'baseline' })}>
          <SectionHeader>Links</SectionHeader>
          <jsx_1.HStack gap="xs" flexWrap="wrap">
            {links.map(function (link, i) { return <Link_1.Link key={"".concat(i, "-").concat(link.url)} value={link}/>; })}
          </jsx_1.HStack>
        </section>)}
      {description.isEmpty && (<core_1.Text component="div" fw={500} size="xs" c="dimmed" style={{ userSelect: 'none' }}>No description</core_1.Text>)}
      {description.nonEmpty && (<section>
          <SectionHeader>Description</SectionHeader>
          <base_primitives_1.Markdown value={description} fontSize="sm" emptyText="No description" className={(0, css_1.css)({
                userSelect: 'all',
            })}/>
        </section>)}
    </core_1.Popover.Dropdown>);
};
var ViewBadge = function (_a) {
    var label = _a.label, value = _a.value;
    return (<jsx_1.HStack gap="0.5">
      <ViewBadgeLabel>{label}</ViewBadgeLabel>
      <core_1.Badge size="sm" radius="sm" variant="light" color="gray" tt="none" fw={500} classNames={{
            root: (0, css_1.css)({
                width: 'max-content',
                overflow: 'visible',
                px: '1',
                color: {
                    _dark: 'mantine.colors.gray[4]',
                    _light: 'mantine.colors.gray[8]',
                },
            }),
            label: (0, css_1.css)({
                overflow: 'visible',
            }),
            section: (0, css_1.css)({
                opacity: 0.5,
                userSelect: 'none',
                marginInlineEnd: '0.5',
            }),
        }}>
        {value}
      </core_1.Badge>
    </jsx_1.HStack>);
};
var ViewBadgeLabel = (0, jsx_1.styled)('div', {
    base: {
        color: 'text.dimmed',
        fontWeight: 'medium',
        fontSize: 'xxs',
        userSelect: 'none',
    },
});
