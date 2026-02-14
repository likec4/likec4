"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IconRendererProvider = IconRendererProvider;
exports.IconRenderer = IconRenderer;
exports.IconOrShapeRenderer = IconOrShapeRenderer;
var css_1 = require("@likec4/styles/css");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
var IconRendererContext = (0, react_1.createContext)(null);
/**
 * Provider for custom element icon renderers
 *
 * @example
 * ```tsx
 * const MyIconRenderer: ElementIconRenderer = ({ node }) => {
 *   return <div>{node.title}</div>
 * }
 *
 * <IconRendererProvider value={MyIconRenderer}>
 *   <LikeC4Diagram />
 * </IconRendererProvider>
 * ```
 */
function IconRendererProvider(_a) {
    var value = _a.value, children = _a.children;
    var outerScope = (0, react_1.useContext)(IconRendererContext);
    if (outerScope) {
        return <>{children}</>;
    }
    return (<IconRendererContext.Provider value={value}>
      {children}
    </IconRendererContext.Provider>);
}
/**
 * Attempts to extract and decode SVG content from a data URL.
 * Returns the decoded SVG string if successful, or null if not an SVG data URL.
 */
function decodeSvgDataUrl(dataUrl) {
    // Check if it's an SVG data URL
    if (!dataUrl.startsWith('data:image/svg+xml')) {
        return null;
    }
    try {
        // Handle both base64 and URL-encoded SVG data URLs
        if (dataUrl.includes(';base64,')) {
            var base64Content = dataUrl.split(';base64,')[1];
            if (base64Content) {
                return atob(base64Content);
            }
        }
        else {
            // URL-encoded format: data:image/svg+xml,%3csvg...
            var encodedContent = dataUrl.split(',')[1];
            if (encodedContent) {
                return decodeURIComponent(encodedContent);
            }
        }
    }
    catch (_a) {
        // If decoding fails, return null to fall back to img tag
    }
    return null;
}
function IconRenderer(_a) {
    var element = _a.element, className = _a.className, style = _a.style;
    var RenderIcon = (0, react_1.useContext)(IconRendererContext);
    if (!element || !element.icon || element.icon === 'none') {
        return null;
    }
    var icon;
    if (element.icon.startsWith('http://') || element.icon.startsWith('https://') || element.icon.startsWith('data:image')) {
        // For SVG data URLs, try to inline the SVG so that CSS color inheritance works (for iconColor support)
        var svgContent = element.icon.startsWith('data:image/svg+xml')
            ? decodeSvgDataUrl(element.icon)
            : null;
        if (svgContent) {
            // Inline the SVG content directly
            // This allows CSS `color` property to affect `currentColor` in the SVG
            // Using display: contents so the span doesn't affect flexbox layout
            icon = <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: svgContent }}/>;
        }
        else {
            // For non-SVG images (PNG, etc.) or failed SVG decoding, use img tag
            icon = <img src={element.icon} alt={element.title}/>;
        }
    }
    else if (RenderIcon) {
        icon = <RenderIcon node={element}/>;
    }
    if (!icon) {
        return null;
    }
    return (<div className={(0, css_1.cx)(className, 'likec4-element-icon')} data-likec4-icon={element.icon} style={style}>
      {icon}
    </div>);
}
var ShapeIcons = {
    browser: icons_react_1.IconBrowser,
    cylinder: icons_react_1.IconCylinder,
    mobile: icons_react_1.IconDeviceMobile,
    person: icons_react_1.IconUser,
    queue: icons_react_1.IconReorder,
    rectangle: icons_react_1.IconRectangularPrism,
    storage: icons_react_1.IconCylinder,
    bucket: icons_react_1.IconCylinder,
    document: icons_react_1.IconFileText,
    component: icons_react_1.IconRectangularPrism,
};
function IconOrShapeRenderer(_a) {
    var element = _a.element, className = _a.className, style = _a.style;
    if (!element.icon || element.icon === 'none') {
        var ShapeIcon = ShapeIcons[element.shape];
        return (<div className={(0, css_1.cx)(className, 'likec4-shape-icon')} style={style}>
        <ShapeIcon />
      </div>);
    }
    return <IconRenderer element={element} className={className} style={style}/>;
}
