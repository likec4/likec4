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
exports.ElementsColumn = void 0;
var utils_1 = require("@likec4/core/utils");
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var m = require("motion/react-m");
var react_1 = require("react");
var remeda_1 = require("remeda");
var IconRenderer_1 = require("../../context/IconRenderer");
var useCallbackRef_1 = require("../../hooks/useCallbackRef");
var useLikeC4Model_1 = require("../../hooks/useLikeC4Model");
var hooks_1 = require("../hooks");
var _shared_css_1 = require("./_shared.css");
var styles = require("./ElementsColumn.css");
var utils_2 = require("./utils");
var ViewsColum_1 = require("./ViewsColum");
function useElementsColumnData() {
    var model = (0, useLikeC4Model_1.useLikeC4Model)();
    // We will mutate this array to build the tree structure
    var allElements = (0, react_1.useMemo)(function () {
        return (0, remeda_1.pipe)(model.elements(), (0, utils_1.ifilter)(function (i) { return !i.imported; }), (0, utils_1.imap)(function (element) { return ({
            label: element.title,
            value: element.id,
            element: element,
            // searchTerms,
            viewsCount: __spreadArray([], element.views(), true).length,
            children: [],
        }); }), (0, utils_1.toArray)());
    }, [model]);
    var search = (0, hooks_1.useNormalizedSearch)();
    return (0, react_1.useMemo)(function () {
        var searchTerms = search.split('.');
        var elements;
        if (search === '' || search === 'kind:') {
            elements = allElements;
        }
        else if (search.startsWith('kind:')) {
            var searchKind_1 = search.slice(5);
            elements = (0, remeda_1.filter)(allElements, function (_a) {
                var element = _a.element;
                return element.kind.toLocaleLowerCase()[searchKind_1.length > 4 ? 'startsWith' : 'includes'](searchKind_1);
            });
        }
        else if (search.startsWith('#')) {
            var searchTag_1 = search.slice(1);
            elements = (0, remeda_1.filter)(allElements, function (_a) {
                var element = _a.element;
                return element.tags.some(function (tag) { return tag.toLocaleLowerCase().includes(searchTag_1); });
            });
        }
        else if ((0, remeda_1.hasAtLeast)(searchTerms, 2)) {
            var satisfies_1 = function (element) {
                var fqnParts = element.id.toLocaleLowerCase().split('.');
                if (fqnParts.length < searchTerms.length) {
                    return false;
                }
                var lastMatchIndex = 0;
                for (var i = 0; i < fqnParts.length; i++) {
                    if (fqnParts[i].includes(searchTerms[lastMatchIndex])) {
                        lastMatchIndex++;
                        // All terms matched
                        if (lastMatchIndex === searchTerms.length) {
                            return true;
                        }
                        continue;
                    }
                }
                return false;
            };
            elements = (0, remeda_1.filter)(allElements, function (_a) {
                var element = _a.element;
                return satisfies_1(element);
            });
        }
        else {
            elements = (0, remeda_1.filter)(allElements, function (_a) {
                var element = _a.element;
                var value = element.title + ' ' + element.name + ' ' + (element.summary.md || '');
                return value.toLocaleLowerCase().includes(search);
            });
        }
        var byid = {};
        var _a = (0, remeda_1.pipe)(elements, (0, remeda_1.reduce)(function (acc, treeItem) {
            treeItem.children = [];
            byid[treeItem.value] = treeItem;
            var parent = acc.all.findLast(function (root) { return (0, utils_1.isAncestor)(root.value, treeItem.value); });
            if (parent) {
                parent.children.push(treeItem);
            }
            else {
                acc.roots.push(treeItem);
            }
            acc.all.push(treeItem);
            acc.hash = (0, utils_1.stringHash)(acc.hash + treeItem.value);
            return acc;
        }, {
            hash: 'empty',
            all: [],
            roots: [],
        })), hash = _a.hash, all = _a.all, roots = _a.roots;
        return {
            hash: hash,
            all: all,
            byid: byid,
            roots: roots,
            searchTerms: (0, remeda_1.hasAtLeast)(searchTerms, 1) ? searchTerms : [search],
        };
    }, [allElements, search]);
}
var btn = (0, _shared_css_1.buttonsva)();
exports.ElementsColumn = (0, react_1.memo)(function () {
    var data = useElementsColumnData();
    var handleClick = useHandleElementSelection();
    if (data.all.length === 0) {
        return <ViewsColum_1.NothingFound />;
    }
    return <ElementsTree data={data} handleClick={handleClick}/>;
});
var setHoveredNode = function () { };
function ElementsTree(_a) {
    var _b = _a.data, searchTerms = _b.searchTerms, all = _b.all, byid = _b.byid, hash = _b.hash, roots = _b.roots, handleClick = _a.handleClick;
    var tree = (0, core_1.useTree)({
        multiple: false,
    });
    tree.setHoveredNode = setHoveredNode;
    (0, react_1.useEffect)(function () {
        tree.collapseAllNodes();
        for (var _i = 0, all_1 = all; _i < all_1.length; _i++) {
            var nd = all_1[_i];
            if (nd.children.length > 0) {
                tree.expand(nd.value);
            }
        }
    }, [hash]);
    var onKeyDownCapture = (0, useCallbackRef_1.useCallbackRef)(function (e) {
        var _a, _b;
        var target = e.target;
        var id = target.getAttribute('data-value');
        var node = !!id && byid[id];
        if (!node)
            return;
        if (e.key === 'ArrowUp') {
            if (id === ((_a = roots[0]) === null || _a === void 0 ? void 0 : _a.value)) {
                (0, utils_2.stopAndPrevent)(e);
                (0, utils_2.moveFocusToSearchInput)(target);
            }
            return;
        }
        if (e.key === 'ArrowRight') {
            var hasChildren = node.children.length > 0;
            if (hasChildren && tree.expandedState[id] === false) {
                return;
            }
            var label = (_b = e.target.querySelector('.mantine-Tree-label')) !== null && _b !== void 0 ? _b : target;
            var maxY_1 = label.getBoundingClientRect().y;
            var viewButtons = (0, utils_2.queryAllFocusable)(target, 'views');
            var view = viewButtons.length > 1
                ? viewButtons.find(function (el, i, all) { return (0, utils_2.centerY)(el) > maxY_1 || i === all.length - 1; })
                : null;
            view !== null && view !== void 0 ? view : (view = (0, remeda_1.first)(viewButtons));
            if (view) {
                (0, utils_2.stopAndPrevent)(e);
                view.focus();
            }
            return;
        }
        if (e.key === ' ' || e.key === 'Enter') {
            (0, utils_2.stopAndPrevent)(e);
            handleClick(node.element);
            return;
        }
    });
    return (<core_1.Tree data-likec4-search-elements allowRangeSelection={false} clearSelectionOnOutsideClick selectOnClick={false} tree={tree} data={roots} levelOffset={'lg'} classNames={{
            root: styles.treeRoot,
            node: (0, css_1.cx)(styles.focusable, styles.treeNode),
            label: styles.treeLabel,
            subtree: styles.treeSubtree,
        }} onKeyDownCapture={onKeyDownCapture} renderNode={function (p) { return <ElementTreeNode {...p} searchTerms={searchTerms} handleClick={handleClick}/>; }}/>);
}
function ElementTreeNode(_a) {
    var node = _a.node, elementProps = _a.elementProps, hasChildren = _a.hasChildren, expanded = _a.expanded, handleClick = _a.handleClick, searchTerms = _a.searchTerms;
    var _b = node, label = _b.label, element = _b.element, viewsCount = _b.viewsCount;
    var elementIcon = (0, IconRenderer_1.IconOrShapeRenderer)({
        element: {
            id: element.id,
            title: element.title,
            shape: element.shape,
            icon: element.icon,
        },
        className: (0, css_1.cx)(btn.icon, styles.elementIcon),
    });
    var key = "@tree.".concat(node.value);
    return (<m.div layoutId={key} {...elementProps}>
      <core_1.ActionIcon variant="transparent" size={16} tabIndex={-1} className={(0, css_1.cx)(styles.elementExpandIcon)} style={{
            visibility: hasChildren ? 'visible' : 'hidden',
        }}>
        <icons_react_1.IconChevronRight stroke={3.5} style={{
            transition: 'transform 150ms ease',
            transform: "rotate(".concat(expanded ? '90deg' : '0', ")"),
            width: '100%',
        }}/>
      </core_1.ActionIcon>
      <core_1.UnstyledButton component={m.button} layout tabIndex={-1} data-value={element.id} className={(0, css_1.cx)(btn.root, 'group', 'likec4-element-button')} {...viewsCount > 0 && {
        onClick: function (e) {
            if (!hasChildren || expanded) {
                e.stopPropagation();
                handleClick(element);
            }
        },
    }}>
        {elementIcon}
        <core_1.Box style={{ flexGrow: 1 }}>
          <core_1.Group gap={'xs'} wrap="nowrap" align="center" className={styles.elementTitleAndId}>
            <core_1.Highlight component="div" highlight={searchTerms} className={btn.title}>
              {label}
            </core_1.Highlight>
            <core_1.Tooltip label={element.id} withinPortal={false} fz={'xs'} disabled={!element.id.includes('.')}>
              <core_1.Highlight component="div" highlight={(0, remeda_1.last)(searchTerms)} className={(0, css_1.cx)(styles.elementId, btn.descriptionColor)}>
                {(0, utils_1.nameFromFqn)(element.id)}
              </core_1.Highlight>
            </core_1.Tooltip>
          </core_1.Group>
          <core_1.Highlight component="div" highlight={element.summary.nonEmpty ? searchTerms : []} className={btn.description} lineClamp={1}>
            {element.summary.nonEmpty ? element.summary.text : 'No description'}
          </core_1.Highlight>
        </core_1.Box>

        <jsx_1.Txt as={'div'} className={(0, css_1.cx)(styles.elementViewsCount, btn.descriptionColor)} size={'xs'}>
          {viewsCount === 0 ? 'No views' : (<>
              {viewsCount} view{viewsCount > 1 ? 's' : ''}
            </>)}
        </jsx_1.Txt>
      </core_1.UnstyledButton>
    </m.div>);
}
function useHandleElementSelection() {
    var searchActorRef = (0, hooks_1.useSearchActor)();
    return (0, useCallbackRef_1.useCallbackRef)(function (element) {
        var _a;
        var views = __spreadArray([], element.views(), true);
        if (views.length === 0) {
            return;
        }
        var elementFqn = element.id;
        var onlyOneViewId = (_a = (0, remeda_1.only)(views)) === null || _a === void 0 ? void 0 : _a.id;
        if (!onlyOneViewId) {
            searchActorRef.send({ type: 'pickview.open', elementFqn: elementFqn });
            return;
        }
        searchActorRef.send({
            type: 'navigate.to',
            viewId: onlyOneViewId,
            focusOnElement: elementFqn,
        });
    });
}
