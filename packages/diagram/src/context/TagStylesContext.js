"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagStylesProvider = TagStylesProvider;
exports.useTagSpecifications = useTagSpecifications;
exports.useTagSpecification = useTagSpecification;
var core_1 = require("@likec4/core");
var styles_1 = require("@likec4/core/styles");
var core_2 = require("@mantine/core");
var react_1 = require("react");
var remeda_1 = require("remeda");
var useLikeC4Model_1 = require("../hooks/useLikeC4Model");
var TagStylesContext = (0, react_1.createContext)({});
var radixColors = styles_1.DefaultTagColors;
var generateColorVars = function (spec) {
    var color = spec.color;
    // Tag has a color defined in the specification
    if ((0, core_1.isTagColorSpecified)(spec)) {
        return "\n      --colors-likec4-tag-bg: ".concat(color, ";\n      --colors-likec4-tag-bg-hover: color-mix(in oklab, ").concat(color, ", var(--colors-likec4-mix-color) 20%);\n    ");
    }
    if (!radixColors.includes(color)) {
        return '';
    }
    var textcolor = '12';
    if (['mint', 'grass', 'lime', 'yellow', 'amber'].includes(color)) {
        textcolor = 'dark-2';
    }
    return "\n  --colors-likec4-tag-border: var(--colors-".concat(color, "-8);\n  --colors-likec4-tag-bg: var(--colors-").concat(color, "-9);\n  --colors-likec4-tag-bg-hover: var(--colors-").concat(color, "-10);\n  --colors-likec4-tag-text: var(--colors-").concat(color, "-").concat(textcolor, ");\n  ");
};
function generateStylesheet(tags, rootSelector) {
    if (!tags || (0, remeda_1.isEmpty)(tags)) {
        return '';
    }
    return (0, remeda_1.pipe)((0, remeda_1.entries)(tags), (0, remeda_1.flatMap)(function (_a) {
        var tag = _a[0], spec = _a[1];
        return [
            ":is(".concat(rootSelector, " [data-likec4-tag=\"").concat(tag, "\"]) {"),
            generateColorVars(spec),
            '}',
        ];
    }), (0, remeda_1.join)('\n'));
}
function TagStylesProvider(_a) {
    var _b;
    var children = _a.children, rootSelector = _a.rootSelector;
    var tags = (0, useLikeC4Model_1.useLikeC4Specification)().tags;
    var nonce = (_b = (0, core_2.useMantineStyleNonce)()) === null || _b === void 0 ? void 0 : _b();
    var stylesheet = generateStylesheet(tags, rootSelector);
    return (<TagStylesContext.Provider value={tags}>
      {stylesheet !== '' && <TagStylesheet nonce={nonce} stylesheet={stylesheet}/>}
      {children}
    </TagStylesContext.Provider>);
}
var TagStylesheet = (0, react_1.memo)(function (_a) {
    var stylesheet = _a.stylesheet, nonce = _a.nonce;
    return (<style data-likec4-tags type="text/css" dangerouslySetInnerHTML={{ __html: stylesheet }} nonce={nonce}/>);
});
function useTagSpecifications() {
    return (0, react_1.useContext)(TagStylesContext);
}
function useTagSpecification(tag) {
    var _a;
    var specs = (0, react_1.useContext)(TagStylesContext);
    return (_a = specs[tag]) !== null && _a !== void 0 ? _a : {
        color: 'tomato',
    };
}
