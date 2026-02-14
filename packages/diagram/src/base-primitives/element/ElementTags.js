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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementTags = exports.ElementTag = void 0;
var core_1 = require("@likec4/core");
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var patterns_1 = require("@likec4/styles/patterns");
var recipes_1 = require("@likec4/styles/recipes");
var hooks_1 = require("@mantine/hooks");
var react_1 = require("@xyflow/react");
var fast_equals_1 = require("fast-equals");
var react_2 = require("react");
var remeda_1 = require("remeda");
var TagStylesContext_1 = require("../../context/TagStylesContext");
var useXYFlow_1 = require("../../hooks/useXYFlow");
var xyflow_1 = require("../../utils/xyflow");
exports.ElementTag = (0, react_2.forwardRef)(function (_a, ref) {
    var tag = _a.tag, cursor = _a.cursor, className = _a.className, style = _a.style, props = __rest(_a, ["tag", "cursor", "className", "style"]);
    var spec = (0, TagStylesContext_1.useTagSpecification)(tag);
    return (<jsx_1.Box ref={ref} data-likec4-tag={tag} className={(0, css_1.cx)((0, recipes_1.likec4tag)({
            autoTextColor: (0, core_1.isTagColorSpecified)(spec),
        }), className)} {...props} style={__assign({ cursor: cursor }, style)}>
        <span>#</span>
        <span>{tag}</span>
      </jsx_1.Box>);
});
var propsAreEqual = function (prev, next) {
    var _a, _b;
    return (prev.id === next.id &&
        prev.data.width === next.data.width &&
        ((_a = prev.data.hovered) !== null && _a !== void 0 ? _a : false) === ((_b = next.data.hovered) !== null && _b !== void 0 ? _b : false) &&
        (0, fast_equals_1.deepEqual)(prev.data.tags, next.data.tags));
};
exports.ElementTags = (0, react_2.memo)(function (_a) {
    var id = _a.id, _b = _a.data, tags = _b.tags, width = _b.width, _c = _b.hovered, hovered = _c === void 0 ? false : _c, onTagClick = _a.onTagClick, onTagMouseEnter = _a.onTagMouseEnter, onTagMouseLeave = _a.onTagMouseLeave;
    if (!tags || !(0, remeda_1.hasAtLeast)(tags, 1)) {
        return null;
    }
    return (<WithElementTags id={id} tags={tags} width={width} hovered={hovered} onTagClick={onTagClick} onTagMouseEnter={onTagMouseEnter} onTagMouseLeave={onTagMouseLeave}/>);
}, propsAreEqual);
exports.ElementTags.displayName = 'ElementTags';
function WithElementTags(_a) {
    var id = _a.id, tags = _a.tags, width = _a.width, hovered = _a.hovered, onTagClick = _a.onTagClick, onTagMouseEnter = _a.onTagMouseEnter, onTagMouseLeave = _a.onTagMouseLeave;
    var _b = (0, hooks_1.useHover)(), isTagsBarHovered = _b.hovered, tagsBarRef = _b.ref;
    var _c = (0, hooks_1.useHover)(), isTagsToolbarHovered = _c.hovered, tagsToolbarRef = _c.ref;
    var _d = (0, hooks_1.useDebouncedState)(false, hovered ? 120 : 300), isVisible = _d[0], setVisible = _d[1];
    (0, react_2.useEffect)(function () {
        setVisible(function (visibleNow) {
            if (!visibleNow) {
                return hovered && (isTagsBarHovered || isTagsToolbarHovered);
            }
            return hovered || isTagsBarHovered || isTagsToolbarHovered;
        });
    }, [isTagsBarHovered, isTagsToolbarHovered, hovered]);
    var zoomIsLargeEnough = (0, useXYFlow_1.useCurrentZoomAtLeast)(1.2);
    var maxWidth = (0, react_1.useStore)((0, react_2.useCallback)(function (state) { return Math.max(Math.round(width * state.transform[2]) - 10, 200); }, [Math.round(width)]));
    return (<>
      <div ref={tagsBarRef} className={(0, css_1.cx)('likec4-element-tags', (0, patterns_1.hstack)({
            pointerEvents: 'all',
            gap: '1',
            alignItems: 'flex-end',
            justifyItems: 'stretch',
            position: 'absolute',
            width: '100%',
            bottom: '0',
            left: '0',
            padding: '1',
            _shapeCylinder: {
                bottom: '[5px]',
            },
            _shapeStorage: {
                bottom: '[5px]',
            },
            _shapeQueue: {
                bottom: '0',
                paddingLeft: '[14px]',
            },
        }))} onClick={xyflow_1.stopPropagation}>
        {tags.map(function (tag) { return (<jsx_1.Box key={id + '#' + tag} data-likec4-tag={tag} className={(0, css_1.css)({
                layerStyle: 'likec4.tag',
                flex: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '50px',
                height: '5px',
                _whenHovered: {
                    height: '12px',
                    borderRadius: 'sm',
                    transitionDelay: '.08s',
                },
                transition: 'fast',
            })}/>); })}
      </div>
      <react_1.NodeToolbar isVisible={isVisible} align="start" position={react_1.Position.Bottom}>
        <jsx_1.HStack ref={tagsToolbarRef} css={{
            gap: '0.5',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            pb: 'sm',
            translate: 'auto',
            x: '[-8px]',
        }} style={{
            maxWidth: maxWidth,
        }}>
          {tags.map(function (tag) { return (<exports.ElementTag key={tag} tag={tag} cursor="pointer" className={(0, css_1.css)(__assign({ userSelect: 'none' }, (zoomIsLargeEnough && {
                fontSize: 'lg',
                borderRadius: 'sm',
                px: '1.5', // 6px
            })))} onClick={onTagClick
                ? (function (e) {
                    e.stopPropagation();
                    onTagClick("#".concat(tag));
                })
                : undefined} onMouseEnter={onTagMouseEnter
                ? function () { return onTagMouseEnter("#".concat(tag)); }
                : undefined} onMouseLeave={onTagMouseLeave
                ? function () { return onTagMouseLeave("#".concat(tag)); }
                : undefined}/>); })}
        </jsx_1.HStack>
      </react_1.NodeToolbar>
    </>);
}
