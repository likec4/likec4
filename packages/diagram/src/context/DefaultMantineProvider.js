"use strict";
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
exports.DefaultMantineProvider = DefaultMantineProvider;
var core_1 = require("@mantine/core");
var DefaultTheme = (0, core_1.createTheme)({
    autoContrast: true,
    primaryColor: 'indigo',
    cursorType: 'pointer',
    defaultRadius: 'sm',
    fontFamily: 'var(--likec4-app-font, var(--likec4-app-font-default))',
    headings: {
        fontWeight: 'medium',
        sizes: {
            h1: {
                // fontSize: '2rem',
                fontWeight: 'bold',
            },
            h2: {
                fontWeight: 'medium',
                // fontSize: '1.85rem',
            },
        },
    },
    fontSizes: {
        xxs: 'var(--font-sizes-xxs)',
        xs: 'var(--font-sizes-xs)',
        sm: 'var(--font-sizes-sm)',
        md: 'var(--font-sizes-md)',
        lg: 'var(--font-sizes-lg)',
        xl: 'var(--font-sizes-xl)',
    },
    spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
    },
    components: {
        SegmentedControl: core_1.SegmentedControl.extend({
            vars: function (theme, props) {
                var _a;
                return ({
                    root: {
                        // @ts-expect-error
                        '--sc-font-size': theme.fontSizes[(_a = props.fz) !== null && _a !== void 0 ? _a : props.size],
                    },
                });
            },
        }),
        Portal: core_1.Portal.extend({
            defaultProps: {
                reuseTargetNode: true,
            },
        }),
        Tooltip: core_1.Tooltip.extend({
            defaultProps: {
                color: 'dark',
            },
        }),
    },
});
function DefaultMantineProvider(_a) {
    var children = _a.children, theme = _a.theme, props = __rest(_a, ["children", "theme"]);
    return (<core_1.MantineProvider defaultColorScheme="auto" theme={theme !== null && theme !== void 0 ? theme : DefaultTheme} {...props}>
      {children}
    </core_1.MantineProvider>);
}
