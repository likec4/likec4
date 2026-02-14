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
exports.Link = void 0;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
var GithubIcon_1 = require("./GithubIcon");
var GITHUB_PREFIX = 'https://github.com/';
exports.Link = (0, react_1.forwardRef)(function (_a, ref) {
    var value = _a.value, className = _a.className, props = __rest(_a, ["value", "className"]);
    // If the url is already a full url, use it as is.
    // Otherwise, it's a relative url and we need to make it absolute.
    var url = value.url.includes('://') ? value.url : new window.URL(value.url, window.location.href).toString();
    var isGithub = url.startsWith(GITHUB_PREFIX);
    return (<core_1.Badge ref={ref} variant="default" radius="sm" size="sm" tt="none" leftSection={value.title ? <>{value.title}</> : null} rightSection={<core_1.CopyButton value={url} timeout={1500}>
            {function (_a) {
                var copy = _a.copy, copied = _a.copied;
                return (<core_1.ActionIcon className={(0, css_1.css)({
                        opacity: copied ? 1 : 0.45,
                        transition: 'fast',
                        _hover: {
                            opacity: 1,
                        },
                    })} tabIndex={-1} size={'20'} variant={copied ? 'light' : 'transparent'} color={copied ? 'teal' : 'gray'} data-active={copied} onClick={function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        copy();
                    }}>
                {copied ? <icons_react_1.IconCheck /> : <icons_react_1.IconCopy stroke={2.5}/>}
              </core_1.ActionIcon>);
            }}
          </core_1.CopyButton>} {...props} className={(0, css_1.cx)(className, 'group')} classNames={{
            root: (0, css_1.css)({
                flexWrap: 'nowrap',
                minHeight: 24,
                maxWidth: 500,
                userSelect: 'all',
                pr: '0',
                backgroundColor: {
                    base: 'transparent',
                    _hover: {
                        base: 'mantine.colors.gray[1]',
                        _dark: 'mantine.colors.dark[5]',
                    },
                },
            }),
            section: (0, css_1.css)({
                '&:is([data-position="left"])': {
                    color: 'text.dimmed',
                    userSelect: 'none',
                    pointerEvents: 'none',
                    _groupHover: {
                        color: '[var(--badge-color)]',
                        opacity: .7,
                    },
                },
            }),
        }}>
        <jsx_1.styled.a href={url} target="_blank" style={{
            color: 'var(--badge-color)',
            cursor: 'pointer',
        }} css={{
            transition: 'fast',
            opacity: {
                base: 0.7,
                _hover: 1,
            },
            textDecoration: {
                base: 'none',
                _hover: 'underline',
            },
        }}>
          {isGithub && (<GithubIcon_1.GithubIcon height="12" width="12" style={{ verticalAlign: 'middle', marginRight: '4px' }}/>)}
          {isGithub ? url.replace(GITHUB_PREFIX, '') : url}
        </jsx_1.styled.a>
      </core_1.Badge>);
});
