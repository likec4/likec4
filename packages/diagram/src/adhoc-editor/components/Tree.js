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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tree = void 0;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var icons_react_1 = require("@tabler/icons-react");
var IconRenderer_1 = require("../../context/IconRenderer");
// const shouldForwardProp = (prop: string, variantKeys: string[]): boolean =>
//   !variantKeys.includes(prop) && (isValidMotionProp(prop) || !isCssProperty(prop))
var statebtn = (0, css_1.cva)({
    base: {
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        justifySelf: 'flex-end',
        fontSize: '[8px]',
        fontFamily: 'mono',
        fontWeight: 'bold',
        letterSpacing: '[0.5px]',
        marginLeft: '2',
        // marginRight: '[calc((var(--depth, 1) - 1) * {spacing.4.5} + {spacing.2})]',
        py: '1',
        px: '1.5',
        lineHeight: '1',
        rounded: 'sm',
        minWidth: 32,
        transition: 'normal',
        _hover: {
            color: 'text.bright',
        },
    },
    variants: {
        state: (_a = {},
            // 'include-explicit' | 'include-implicit' | 'exclude' | 'disabled' | 'not-present'
            _a['include-explicit'] = {
                backgroundColor: 'grass.6',
                color: 'text',
                // color: 'grass.0',
            },
            _a['include-implicit'] = {
                backgroundColor: 'grass.6',
                color: 'text',
                // color: 'grass.0',
            },
            _a.exclude = {
                backgroundColor: 'red.6',
                color: 'text',
            },
            _a['disabled'] = {
                // backgroundColor: 'default.disabled',
                color: 'text.dimmed',
            },
            _a['not-present'] = {
                color: 'text.dimmed',
                backgroundColor: 'default.hover/50',
            },
            _a),
    },
    defaultVariants: {
        state: 'not-present',
    },
});
var icon = css_1.css.raw({
    flex: 0,
    display: 'flex',
    alignItems: 'center',
    color: 'text.dimmed',
    //   _groupFocus: 'inherit',
    //   _groupHover: 'inherit',
    // },
    _groupHover: {
        color: 'text',
    },
    _groupFocusWithin: {
        color: 'mantine.colors.primary.lightColor!',
    },
    _groupFocusVisible: {
        color: 'mantine.colors.primary.lightColor!',
    },
    '& :where(.likec4-shape-icon, .likec4-element-icon)': {
        display: 'contents',
    },
    '& :where(svg, img)': {
        width: '10px',
        height: '10px',
    },
    '@/md': {
        '& :where(svg, img)': {
            width: '14px',
            height: '14px',
        },
    },
    '@/lg': {
        '& :where(svg, img)': {
            width: '16px',
            height: '16px',
        },
    },
    opacity: {
        base: 0.8,
        _groupFocusVisible: 1,
        _groupHover: 1,
    },
});
var control = css_1.css.raw({
    paddingLeft: '[calc((var(--depth, 1) - 1) * {spacing.2} + {spacing.1})]',
    px: '1',
    py: '1',
    mb: '0',
    columnGap: '1',
    '@/md': {
        paddingLeft: '[calc((var(--depth, 1) - 1) * {spacing.2} + {spacing.2})]',
        px: '2',
        py: '1.5',
        mb: '0.5',
        columnGap: '2',
    },
    '@/lg': {
        paddingLeft: '[calc((var(--depth, 1) - 1) * {spacing.3} + {spacing.2.5})]',
        py: '2.5',
    },
    cursor: 'pointer',
    border: 'none',
    appearance: 'none',
    width: 'full',
    alignItems: 'center',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    gridTemplateRows: 'auto auto',
    rounded: 'sm',
    backgroundColor: {
        base: 'transparent',
        _hover: {
            base: 'mantine.colors.gray[1]',
            _dark: 'mantine.colors.dark[5]',
        },
        _focusWithin: 'mantine.colors.primary.lightHover!',
        _focusVisible: 'mantine.colors.primary.lightHover!',
    },
    color: {
        base: 'text',
        _hover: 'text.bright',
        _focusWithin: 'mantine.colors.primary.lightColor!',
        _focusVisible: 'mantine.colors.primary.lightColor!',
    },
    // _hover: {
    //   backgroundColor: {
    //     base: 'mantine.colors.gray[1]',
    //     _dark: 'mantine.colors.dark[5]',
    //   },
    // },
    _focusVisible: {
        outline: 'none',
        // backgroundColor: 'mantine.colors.primary.lightHover!',
    },
});
var tree = (0, css_1.sva)({
    slots: [
        'branch',
        'item', // leaf
        'control', // branch control
        'state', // chip
        'icon',
        'label',
        'content', // branch content
        'indicator', // branch indicator
    ],
    base: {
        branch: {},
        item: __assign({}, control),
        control: __assign({}, control),
        state: {
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifySelf: 'flex-end',
            marginLeft: '2',
            // marginRight: '[calc((var(--depth, 1) - 1) * {spacing.4.5} + {spacing.2})]',
            '--chip-fz': '9px',
            '--chip-checked-padding': '{spacing.1}',
            '--chip-padding': '{spacing.1}',
            '--chip-spacing': '0',
            '--chip-size': '16px',
            // '& label': {
            //   color: 'text',
            //   _groupFocusVisible: {
            //     backgroundColor: 'mantine.colors.primary.lightHover!',
            //   },
            //   // backgroundColor: 'transparent',
            // },
            transition: 'opacity 150ms ease-out',
            // opacity: {
            //   base: 0.4,
            //   _checked: 1,
            //   _groupFocusVisible: 1,
            //   _groupHover: 1,
            // },
        },
        icon: __assign({}, icon),
        label: {
            cursor: 'inherit',
            color: 'inherit',
            userSelect: 'none',
            textStyle: 'xxs',
            truncate: 'ellipsis',
            '@/sm': {
                textStyle: 'xs',
            },
            '@/md': {
                textStyle: 'sm',
            },
            fontWeight: '[450]',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2',
        },
        indicator: {
            color: 'inherit',
            transition: 'transform 150ms ease-out',
            width: '12px',
            opacity: 0.75,
            '@/md': {
                width: '14px',
            },
            _open: {
                transform: 'rotate(90deg)',
            },
        },
        content: {},
    },
    variants: {},
    defaultVariants: {},
});
var _b = (0, jsx_1.createStyleContext)(tree), withRootProvider = _b.withRootProvider, withContext = _b.withContext;
var Root = withRootProvider('div');
var Branch = withContext('div', 'branch');
var Item = withContext('div', 'item', {
    forwardProps: [],
    defaultProps: {
        className: 'group',
    },
});
var Control = withContext('div', 'control', {
    forwardProps: [],
    defaultProps: {
        className: 'group',
    },
});
var ElementState = function (_a) {
    var node = _a.node, state = _a.state, onClick = _a.onClick, className = _a.className, props = __rest(_a, ["node", "state", "onClick", "className"]);
    var cls = (0, css_1.cx)(className, 'mantine-active', statebtn({ state: state }));
    return (<div {...props} onClick={onClick} className={cls}>
      {state}
    </div>);
};
var State = withContext(ElementState, 'state', {
    forwardProps: ['node', 'state', 'onClick', 'className'],
});
var Icon = withContext(IconRenderer_1.IconOrShapeRenderer, 'icon', {
    forwardProps: ['element', 'className'],
});
var Label = withContext('div', 'label', {
    forwardProps: [],
});
var Content = withContext('div', 'content', {
    forwardProps: [],
});
var Indicator = withContext(icons_react_1.IconChevronRight, 'indicator', {
    forwardProps: [],
    defaultProps: {
        size: 14,
    },
});
exports.Tree = {
    Root: Root,
    Branch: Branch,
    Item: Item,
    Control: Control,
    State: State,
    Icon: Icon,
    Label: Label,
    Content: Content,
    Indicator: Indicator,
};
