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
exports.ElementData = ElementData;
var types_1 = require("@likec4/core/types");
var css_1 = require("@likec4/styles/css");
var recipes_1 = require("@likec4/styles/recipes");
var react_1 = require("react");
var remeda_1 = require("remeda");
var IconRenderer_1 = require("../../context/IconRenderer");
var useLikeC4Styles_1 = require("../../hooks/useLikeC4Styles");
var Markdown_1 = require("../Markdown");
/**
 * Resolve the icon color based on the node's style and color.
 *
 * If the node's style icon color is not defined, returns undefined.
 * If the node's style icon color is the same as the node's color, returns the stroke color.
 * Otherwise, returns the fill color.
 */
var resolveIconColor = function (styles, data) {
    var iconColor = data.style.iconColor;
    if (!iconColor) {
        return undefined;
    }
    var colors = styles.colors(iconColor).elements;
    return iconColor === data.color ? colors.stroke : colors.fill;
};
var Root = (0, react_1.forwardRef)(function (_a, ref) {
    var className = _a.className, style = _a.style, data = _a.data, props = __rest(_a, ["className", "style", "data"]);
    var styles = (0, useLikeC4Styles_1.useLikeC4Styles)();
    var iconSize = data.style.iconSize
        ? styles.nodeSizes(data.style).values.iconSize
        : undefined;
    var resolvedIconColor = resolveIconColor(styles, data);
    return (<div {...props} ref={ref} className={(0, css_1.cx)(className, (0, recipes_1.elementNodeData)({
            iconPosition: data.style.iconPosition,
            withIconColor: !!resolvedIconColor,
        }), 'likec4-element')} style={__assign(__assign(__assign({}, style), (iconSize && {
            // @ts-ignore
            '--likec4-icon-size': "".concat(iconSize, "px"),
        })), (resolvedIconColor && {
            // @ts-ignore
            '--likec4-icon-color': resolvedIconColor,
        }))}/>);
});
var Icon = function (_a) {
    var data = _a.data, props = __rest(_a, ["data"]);
    return <IconRenderer_1.IconRenderer element={data} {...props}/>;
};
var Content = (0, react_1.forwardRef)(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<div {...props} className={(0, css_1.cx)(className, 'likec4-element-node-content')} ref={ref}/>);
});
var Title = (0, react_1.forwardRef)(function (_a, ref) {
    var title = _a.data.title, className = _a.className, props = __rest(_a, ["data", "className"]);
    return (<div {...props} className={(0, css_1.cx)(className, 'likec4-element-title')} data-likec4-node-title="" ref={ref}>
      {title}
    </div>);
});
var Technology = (0, react_1.forwardRef)(function (_a, ref) {
    var _b;
    var data = _a.data, children = _a.children, className = _a.className, props = __rest(_a, ["data", "children", "className"]);
    var text = (_b = data === null || data === void 0 ? void 0 : data.technology) !== null && _b !== void 0 ? _b : children;
    return (0, remeda_1.isTruthy)(text)
        ? (<div {...props} className={(0, css_1.cx)(className, 'likec4-element-technology')} data-likec4-node-technology="" ref={ref}>
        {text}
      </div>)
        : null;
});
var Description = (0, react_1.forwardRef)(function (_a, ref) {
    var description = _a.data.description, className = _a.className, props = __rest(_a, ["data", "className"]);
    if (!description) {
        return null;
    }
    var desc = types_1.RichText.from(description);
    return (<Markdown_1.Markdown {...props} className={(0, css_1.cx)(className, 'likec4-element-description')} data-likec4-node-description="" value={desc} uselikec4palette hideIfEmpty style={{
            // Workaround for lineClamp not working with nested TABLE elements (if markdown has tables)
            maxHeight: desc.isMarkdown ? '8rem' : undefined,
        }} ref={ref}/>);
});
/**
 * Renders an element title, technology, description, and icon.
 *
 * @example
 * ```tsx
 * <ElementData {...nodeProps} />
 * ```
 * or
 * ```tsx
 * <ElementData.Root {...nodeProps} >
 *   <ElementData.Icon {...nodeProps} />
 *   <ElementData.Content>
 *     <ElementData.Title {...nodeProps} />
 *     <ElementData.Technology {...nodeProps} />
 *     <ElementData.Description {...nodeProps} />
 *   </ElementData.Content>
 * </ElementData.Root>
 * ```
 */
function ElementData(_a) {
    var data = _a.data;
    return (<Root data={data}>
      <Icon data={data}/>
      <Content>
        <Title data={data}/>
        <Technology data={data}/>
        <Description data={data}/>
      </Content>
    </Root>);
}
ElementData.Root = Root;
ElementData.Icon = Icon;
ElementData.Content = Content;
ElementData.Title = Title;
ElementData.Technology = Technology;
ElementData.Description = Description;
