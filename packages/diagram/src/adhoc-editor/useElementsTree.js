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
exports.createTreeCollection = createTreeCollection;
exports.useElementsTree = useElementsTree;
var utils_1 = require("@likec4/core/utils");
var react_1 = require("@zag-js/react");
var tree = require("@zag-js/tree-view");
var react_2 = require("react");
var remeda_1 = require("remeda");
var useId_1 = require("../hooks/useId");
var panel_1 = require("./state/panel");
function getElementState(id, states) {
    if (!states) {
        return 'not-present';
    }
    if (states.disabled.has(id)) {
        return 'disabled';
    }
    if (states.includedExplicit.has(id)) {
        return 'include-explicit';
    }
    if (states.includedImplicit.has(id)) {
        return 'include-implicit';
    }
    if (states.excluded.has(id)) {
        return 'exclude';
    }
    return 'not-present';
}
function mapToTreeNodes(elements, states) {
    return (0, utils_1.toArray)(elements).map(function (el) {
        var _a;
        return ({
            id: el.id,
            title: el.title,
            shape: el.shape,
            icon: (_a = el.icon) !== null && _a !== void 0 ? _a : undefined,
            children: mapToTreeNodes(el.children(), states),
            state: getElementState(el.id, states),
        });
    });
}
function createTreeCollection(model, states) {
    return tree.collection({
        rootNode: {
            id: '@ROOT',
            title: '',
            shape: 'rectangle',
            icon: undefined,
            children: mapToTreeNodes(model.roots(), states),
            state: 'not-present',
        },
        nodeToValue: function (node) {
            return node.id;
        },
        nodeToString: function (node) {
            return node.title;
        },
        nodeToChildren: function (node) {
            return node.children;
        },
        isNodeDisabled: function () {
            return false;
        },
    });
}
var select = (0, panel_1.selectEditorPanelState)(function (s) { return ({
    searchInput: s.searchInput.length > 2 ? s.searchInput.toLowerCase() : '',
    collection: s.collection,
}); }, function (a, b) { return (a === null || a === void 0 ? void 0 : a.searchInput) === b.searchInput && (a === null || a === void 0 ? void 0 : a.collection.isEqual(b.collection)); });
function useElementsTree() {
    var _a;
    var _b = (0, panel_1.useEditorPanelState)(select), searchInput = _b.searchInput, collection = _b.collection;
    var lowerCaseInput = (0, react_2.useDeferredValue)(searchInput);
    var filteredCollection = (0, react_2.useMemo)(function () {
        if (!lowerCaseInput)
            return collection;
        return collection.filter(function (c) { return c.title.toLowerCase().includes(lowerCaseInput); });
    }, [collection, lowerCaseInput]);
    var _c = (0, react_2.useState)([]), expandedValue = _c[0], setExpandedValue = _c[1];
    // const filteredExpandedValue = useMemo(() => {
    //   if (filteredCollection === collection) {
    //     return
    //   }
    //   const branchValues = filteredCollection.getBranchValues()
    //   return expandedValue.filter(value => branchValues.includes(value))
    // }, [filteredCollection, expandedValue])
    // // const newBranches = filteredCollection !== collection
    // //   ? difference(filteredCollection.getBranchValues(), expandedValue).join(',')
    // //   : ''
    (0, react_2.useEffect)(function () {
        if (filteredCollection === collection) {
            return;
        }
        setExpandedValue(function (current) {
            var newBranches = (0, remeda_1.difference)(filteredCollection.getBranchValues(), current);
            if ((0, remeda_1.hasAtLeast)(newBranches, 1)) {
                return (0, remeda_1.sort)(__spreadArray(__spreadArray([], current, true), newBranches, true), (0, utils_1.compareNaturalHierarchically)());
            }
            return current;
        });
    }, [filteredCollection]);
    var service = (0, react_1.useMachine)(tree.machine, {
        id: (0, useId_1.useId)(),
        collection: filteredCollection,
        defaultCheckedValue: [],
        defaultSelectedValue: [],
        expandedValue: expandedValue,
        onExpandedChange: function (_a) {
            var expandedValue = _a.expandedValue;
            setExpandedValue(expandedValue);
        },
        // checkedValue,
        // defaultExpandedValue: [],
        // defaultFocusedValue: null,
        // onCheckedChange({ checkedValue }) {
        //   console.log({ checkedValue })
        // },
        onFocusChange: function (details) {
            console.log('Focus change', details);
        },
        onSelectionChange: function (details) {
            console.log('Selection change', details);
        },
        // expandOnClick,
        // onSelectionChange({ focusedValue, selectedNodes }) {
        //   console.log({ focusedValue, selectedNodes })
        //   if (selectedNodes.length === 0) {
        //     return
        //   }
        //   api.deselect(selectedNodes.map(n => n.id))
        // },
    });
    (_a = service.context.get('focusedValue')) === null || _a === void 0 ? void 0 : _a.slice;
    var api = tree.connect(service, react_1.normalizeProps);
    api.select;
    (0, panel_1.useOnEditorPanelEvent)('inputKeyDown', function () {
        var _a;
        var first = (_a = api.collection.getFirstNode()) === null || _a === void 0 ? void 0 : _a.id;
        if (first) {
            api.focus(first);
        }
    });
    return api;
}
