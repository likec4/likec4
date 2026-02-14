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
exports.NavigationPanelDropdown = void 0;
var model_1 = require("@likec4/core/model");
var utils_1 = require("@likec4/core/utils");
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var patterns_1 = require("@likec4/styles/patterns");
var core_1 = require("@mantine/core");
var hooks_1 = require("@mantine/hooks");
var web_1 = require("@react-hookz/web");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("@xstate/react");
var fast_equals_1 = require("fast-equals");
var react_2 = require("react");
var remeda_1 = require("remeda");
var NavigationLink_1 = require("../components/NavigationLink");
var useDiagram_1 = require("../hooks/useDiagram");
var useLikeC4Model_1 = require("../hooks/useLikeC4Model");
var ProjectsMenu_1 = require("./dropdown/ProjectsMenu");
var hooks_2 = require("./hooks");
var styles_css_1 = require("./styles.css");
var scopedKeydownHandler = (0, core_1.createScopedKeydownHandler)({
    siblingSelector: '[data-likec4-focusable]',
    parentSelector: '[data-likec4-breadcrumbs-dropdown]',
    activateOnFocus: false,
    loop: true,
    orientation: 'vertical',
});
function hasSearchQuerySelector(s) {
    return s.context.searchQuery.trim().length >= 2;
}
exports.NavigationPanelDropdown = (0, react_2.memo)(function () {
    var actor = (0, hooks_2.useNavigationActor)();
    var hasSearchQuery = (0, hooks_2.useNavigationActorSnapshot)(hasSearchQuerySelector);
    (0, useDiagram_1.useOnDiagramEvent)('paneClick', function () {
        actor.closeDropdown();
    });
    (0, useDiagram_1.useOnDiagramEvent)('nodeClick', function () {
        actor.closeDropdown();
    });
    (0, useDiagram_1.useOnDiagramEvent)('edgeClick', function () {
        actor.closeDropdown();
    });
    var setSearchQuery = (0, hooks_1.useThrottledCallback)(function (value) {
        actor.send({ type: 'searchQuery.change', value: value });
    }, 250);
    return (<core_1.PopoverDropdown className={(0, css_1.cx)('nowheel', (0, patterns_1.vstack)({
            layerStyle: 'likec4.dropdown',
            gap: 'xs',
            pointerEvents: 'all',
        }))} data-likec4-breadcrumbs-dropdown onMouseLeave={function () { return actor.send({ type: 'dropdown.mouseLeave' }); }} onMouseEnter={function () { return actor.send({ type: 'dropdown.mouseEnter' }); }}>
      <ProjectsMenu_1.ProjectsMenu />
      <jsx_1.HStack gap="xs">
        <SearchInput defaultValue={actor.actorRef.getSnapshot().context.searchQuery} onChange={setSearchQuery}/>
        {
        /* <Button
        variant="default"
        size={'xs'}
        onClick={(e) => {
          e.stopPropagation()
          actor.send({ type: 'dropdown.dismiss' })
        }}
      >
        Close
      </Button> */
        }
      </jsx_1.HStack>
      <core_1.ScrollAreaAutosize scrollbars="x" type="auto" offsetScrollbars="present" classNames={{
            root: (0, css_1.css)({
                maxWidth: [
                    'calc(100vw - 50px)',
                    'calc(100cqw - 50px)',
                ],
            }),
        }} styles={{
            viewport: {
                overscrollBehavior: 'none',
            },
        }}>
        {hasSearchQuery
            ? <SearchResults />
            : <FolderColumns />}
      </core_1.ScrollAreaAutosize>
    </core_1.PopoverDropdown>);
});
exports.NavigationPanelDropdown.displayName = 'NavigationPanelDropdown';
function selectSearchQuery(s) {
    return (0, model_1.normalizeViewPath)(s.context.searchQuery);
}
var compare = (0, utils_1.compareNaturalHierarchically)(model_1.VIEW_FOLDERS_SEPARATOR);
var SearchResults = (0, react_2.memo)(function () {
    var likec4model = (0, useLikeC4Model_1.useLikeC4Model)();
    var actor = (0, hooks_2.useNavigationActor)();
    var searchQuery = (0, react_1.useSelector)(actor.actorRef, selectSearchQuery);
    var deferredSearchQuery = (0, react_2.useDeferredValue)(searchQuery);
    var isSearchByPath = deferredSearchQuery.includes(model_1.VIEW_FOLDERS_SEPARATOR);
    var highlight = isSearchByPath ? deferredSearchQuery.split(model_1.VIEW_FOLDERS_SEPARATOR) : deferredSearchQuery;
    var _a = (0, react_2.useState)([]), found = _a[0], setFound = _a[1];
    (0, react_2.useEffect)(function () {
        setFound(function (current) {
            var results = (0, remeda_1.pipe)(likec4model.views(), (0, utils_1.ifilter)(function (v) {
                var _a;
                // if search query contains folder separator, search in view data
                if (isSearchByPath && v.$view.title) {
                    return (0, model_1.normalizeViewPath)(v.$view.title).toLowerCase().includes(deferredSearchQuery);
                }
                return v.id.toLowerCase().includes(deferredSearchQuery) ||
                    !!((_a = v.title) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(deferredSearchQuery));
            }), (0, utils_1.ifirst)(20), (0, utils_1.toArray)(), (0, remeda_1.sort)(function (a, b) { return compare(a.folder.path, b.folder.path); }));
            return (0, fast_equals_1.shallowEqual)(results, current) ? current : results;
        });
    }, [likec4model, deferredSearchQuery, isSearchByPath]);
    if (found.length === 0)
        return <div>no results</div>;
    return (<core_1.ScrollAreaAutosize scrollbars="xy" offsetScrollbars={false} className={(0, css_1.css)({
            width: '100%',
            maxWidth: [
                'calc(100vw - 250px)',
                'calc(100cqw - 250px)',
            ],
            maxHeight: [
                'calc(100vh - 200px)',
                'calc(100cqh - 200px)',
            ],
        })}>
      <jsx_1.VStack gap="0.5">
        {found.map(function (v) { return (<FoundedView key={v.id} view={v} highlight={highlight} onClick={function (e) {
                e.stopPropagation();
                actor.selectView(v.id);
            }} data-likec4-focusable onKeyDown={scopedKeydownHandler}/>); })}
      </jsx_1.VStack>
    </core_1.ScrollAreaAutosize>);
});
var foundedViewClass = (0, patterns_1.hstack)({
    gap: 'xxs',
    rounded: 'sm',
    px: 'xs',
    py: 'xxs',
    _hover: {
        backgroundColor: {
            base: 'mantine.colors.gray[1]',
            _dark: 'mantine.colors.dark[5]',
        },
    },
    _focus: {
        outline: 'none',
        color: 'mantine.colors.primary.lightColor!',
        backgroundColor: 'mantine.colors.primary.lightHover!',
    },
});
var inheritColor = (0, css_1.css)({
    _groupFocus: {
        color: '[inherit!]',
        transition: 'none',
    },
});
function FoundedView(_a) {
    var _b;
    var view = _a.view, highlight = _a.highlight, props = __rest(_a, ["view", "highlight"]);
    var folder = view.folder;
    var viewIcon = ViewTypeIcon[view.id === 'index' ? 'index' : view._type];
    var viewLabel = (<core_1.Highlight key={view.id} component={'div'} className={(0, css_1.cx)(inheritColor, (0, styles_css_1.breadcrumbTitle)({ truncate: true }), (0, css_1.css)({
            '& > mark': {
                backgroundColor: {
                    base: 'mantine.colors.yellow[2]/90',
                    _dark: 'mantine.colors.yellow[5]/80',
                    _groupFocus: '[transparent]',
                },
                color: {
                    _groupFocus: '[inherit!]',
                },
            },
        }))} maw={350} highlight={highlight}>
      {(_b = view.title) !== null && _b !== void 0 ? _b : view.id}
    </core_1.Highlight>);
    var className = (0, css_1.cx)(props.className, 'group', foundedViewClass);
    if (folder.isRoot) {
        return (<core_1.UnstyledButton {...props} className={className}>
        {viewIcon}
        {viewLabel}
      </core_1.UnstyledButton>);
    }
    var breadcrumbs = folder.breadcrumbs.map(function (b) { return (<core_1.Highlight key={b.path} component={'div'} className={(0, css_1.cx)((0, css_1.css)({
            _groupHover: {
                color: 'text.dimmed',
            },
        }), inheritColor, (0, styles_css_1.breadcrumbTitle)({ dimmed: true, truncate: true }))} maw={170} highlight={(0, remeda_1.isArray)(highlight) ? highlight : []}>
      {b.title}
    </core_1.Highlight>); });
    breadcrumbs.push(<jsx_1.HStack gap="[4px]">
      {viewIcon}
      {viewLabel}
    </jsx_1.HStack>);
    return (<core_1.UnstyledButton {...props} className={className}>
      {folderIcon}
      <core_1.Breadcrumbs separator={btnRightSection} separatorMargin={3}>
        {breadcrumbs}
      </core_1.Breadcrumbs>
    </core_1.UnstyledButton>);
}
var btnRightSection = <icons_react_1.IconChevronRight size={12} stroke={1.5} className="mantine-rotate-rtl"/>;
var folderIcon = (<icons_react_1.IconFolderFilled size={16} 
// stroke={1.5}
className={(0, css_1.css)({
        opacity: {
            base: 0.3,
            _groupHover: 0.5,
            _groupActive: 0.5,
            _groupFocus: 0.5,
        },
    })}/>);
var viewTypeIconCss = (0, css_1.css)({
    opacity: {
        base: 0.3,
        _dark: 0.5,
        _groupHover: 0.8,
        _groupActive: 0.8,
        _groupFocus: 0.8,
    },
});
var ViewTypeIcon = {
    index: <icons_react_1.IconStarFilled size={16} className={viewTypeIconCss}/>,
    element: (<icons_react_1.IconZoomScan size={18} stroke={2} className={viewTypeIconCss}/>),
    deployment: <icons_react_1.IconStack2 size={16} stroke={1.5} className={viewTypeIconCss}/>,
    dynamic: <icons_react_1.IconDirectionSignFilled size={18} className={viewTypeIconCss}/>,
};
var ColumnScrollArea = core_1.ScrollAreaAutosize.withProps({
    scrollbars: 'y',
    className: (0, css_1.css)({
        maxHeight: [
            'calc(100vh - 160px)',
            'calc(100cqh - 160px)',
        ],
    }),
});
function folderColumn(folder, context) {
    return {
        folderPath: folder.path,
        items: __spreadArray(__spreadArray([], folder.folders.map(function (s) { return ({
            type: 'folder',
            folderPath: s.path,
            title: s.title,
            selected: context.selectedFolder.startsWith(s.path),
        }); }), true), folder.views.map(function (s) {
            var _a, _b;
            return ({
                type: 'view',
                viewType: s.id === 'index' ? 'index' : s._type,
                viewId: s.id,
                title: (_a = s.title) !== null && _a !== void 0 ? _a : s.id,
                description: s.description.nonEmpty && s.description.text || null,
                selected: s.id === ((_b = context.viewModel) === null || _b === void 0 ? void 0 : _b.id),
            });
        }), true),
    };
}
var selectColumns = function (context) {
    var viewModel = context.viewModel;
    if (!viewModel) {
        return [];
    }
    var likec4model = viewModel.$model;
    var columns = [
        folderColumn(likec4model.rootViewFolder, context),
    ];
    var folder = likec4model.viewFolder(context.selectedFolder);
    if (!folder.isRoot) {
        for (var _i = 0, _a = folder.breadcrumbs; _i < _a.length; _i++) {
            var b = _a[_i];
            columns.push(folderColumn(b, context));
        }
    }
    return columns;
};
var FolderColumns = (0, react_2.memo)(function () {
    var columns = (0, hooks_2.useNavigationActorContext)(selectColumns, fast_equals_1.deepEqual);
    return (<jsx_1.HStack gap="xs" alignItems="stretch">
      {columns.flatMap(function (column, i) { return [
            i > 0 && <core_1.Divider orientation="vertical" key={'divider' + i}/>,
            <FolderColumn key={column.folderPath} data={column} isLast={i > 0 && i == columns.length - 1}/>,
        ]; })}
    </jsx_1.HStack>);
});
function FolderColumn(_a) {
    var data = _a.data, isLast = _a.isLast;
    var ref = (0, react_2.useRef)(null);
    var actor = (0, hooks_2.useNavigationActorRef)();
    var onItemClicked = function (item) { return function (e) {
        e.stopPropagation();
        if (item.type === 'folder') {
            actor.send({ type: 'select.folder', folderPath: item.folderPath });
        }
        else {
            actor.send({ type: 'select.view', viewId: item.viewId });
        }
    }; };
    (0, web_1.useMountEffect)(function () {
        if (isLast && ref.current) {
            ref.current.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
                behavior: 'smooth',
            });
        }
    });
    return (<jsx_1.Box mb={'1'} ref={ref}>
      <ColumnScrollArea>
        <jsx_1.VStack gap="0.5">
          {data.items.map(function (item, i) { return (<FolderColumnItem key={"".concat(data.folderPath, "/").concat(item.type, "/").concat(i)} columnItem={item} onClick={onItemClicked(item)}/>); })}
        </jsx_1.VStack>
      </ColumnScrollArea>
    </jsx_1.Box>);
}
function FolderColumnItem(_a) {
    var columnItem = _a.columnItem, props = __rest(_a, ["columnItem"]);
    switch (columnItem.type) {
        case 'folder':
            return (<NavigationLink_1.NavigationLink key={columnItem.folderPath} variant="light" active={columnItem.selected} label={columnItem.title} leftSection={folderIcon} rightSection={btnRightSection} maw="300px" miw="200px" {...props}/>);
        case 'view':
            return (<NavigationLink_1.NavigationLink key={columnItem.viewId} variant="filled" active={columnItem.selected} label={columnItem.title} description={columnItem.description} leftSection={ViewTypeIcon[columnItem.viewType]} maw="300px" miw="200px" {...props}/>);
        default:
            (0, utils_1.nonexhaustive)(columnItem);
    }
}
function SearchInput(props) {
    var _a;
    var _b = (0, hooks_1.useUncontrolled)(__assign(__assign({}, props), { finalValue: '' })), _value = _b[0], handleChange = _b[1];
    return (<core_1.Input size="xs" placeholder="Search by title or id" variant="unstyled" height={(0, core_1.rem)(26)} value={_value} onKeyDown={scopedKeydownHandler} onChange={function (e) { return handleChange(e.currentTarget.value); }} data-likec4-focusable classNames={{
            wrapper: (0, css_1.css)({
                flexGrow: 1,
                backgroundColor: {
                    base: 'mantine.colors.gray[1]',
                    _dark: 'mantine.colors.dark[5]/80',
                    _hover: {
                        base: 'mantine.colors.gray[2]',
                        _dark: 'mantine.colors.dark[4]',
                    },
                    _focus: {
                        base: 'mantine.colors.gray[2]',
                        _dark: 'mantine.colors.dark[4]',
                    },
                },
                rounded: 'sm',
            }),
            input: (0, css_1.css)({
                _placeholder: {
                    color: 'text.dimmed',
                },
                _focus: {
                    outline: 'none',
                },
            }),
        }} style={_a = {},
            _a['--input-fz'] = 'var(--mantine-font-size-sm)',
            _a} leftSection={<icons_react_1.IconSearch size={14}/>} rightSectionPointerEvents="all" rightSectionWidth={'min-content'} rightSection={!props.value || (0, remeda_1.isEmpty)(props.value)
            ? null
            : (<core_1.Button variant="subtle" h="100%" size={'compact-xs'} color="gray" onClick={function (e) {
                    e.stopPropagation();
                    handleChange('');
                }}>
            clear
          </core_1.Button>)}/>);
}
