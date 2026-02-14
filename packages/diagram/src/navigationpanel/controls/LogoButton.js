"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoButton = void 0;
var css_1 = require("@likec4/styles/css");
var patterns_1 = require("@likec4/styles/patterns");
var core_1 = require("@mantine/core");
var m = require("motion/react-m");
var Logo_1 = require("../../components/Logo");
var DiagramEventHandlers_1 = require("../../context/DiagramEventHandlers");
var hooks_1 = require("../hooks");
var LogoButton = function () {
    var actor = (0, hooks_1.useNavigationActor)();
    var onLogoClick = (0, DiagramEventHandlers_1.useDiagramEventHandlers)().onLogoClick;
    return (<m.div layout="position">
      <core_1.UnstyledButton onMouseEnter={function () {
            actor.send({ type: 'breadcrumbs.mouseEnter.root' });
        }} onMouseLeave={function () {
            actor.send({ type: 'breadcrumbs.mouseLeave.root' });
        }} onClick={function (e) {
            e.stopPropagation();
            if (onLogoClick && actor.isOpened()) {
                setTimeout(function () {
                    onLogoClick();
                }, 100);
            }
            actor.send({ type: 'breadcrumbs.click.root' });
        }} className={(0, css_1.cx)('mantine-active', (0, patterns_1.hstack)({
            padding: '0.5',
            // _active: {
            //   transform: 'translateY(1px)',
            // },
            width: {
                base: '[20px]',
                '@/md': '[64px]',
            },
        }))}>
        <Logo_1.Logo className={(0, css_1.css)({
            display: {
                base: 'none',
                '@/md': 'block',
            },
        })}/>
        <Logo_1.LogoIcon className={(0, css_1.css)({
            display: {
                base: 'block',
                '@/md': 'none',
            },
        })}/>
      </core_1.UnstyledButton>
    </m.div>);
};
exports.LogoButton = LogoButton;
