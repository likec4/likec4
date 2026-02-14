"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationButtons = void 0;
var patterns_1 = require("@likec4/styles/patterns");
var icons_react_1 = require("@tabler/icons-react");
var m = require("motion/react-m");
var useDiagram_1 = require("../../hooks/useDiagram");
var _common_1 = require("../_common");
var NavigationButtons = function () {
    var diagram = (0, useDiagram_1.useDiagram)();
    var _a = (0, useDiagram_1.useDiagramContext)(function (s) { return ({
        hasStepBack: s.navigationHistory.currentIndex > 0,
        hasStepForward: s.navigationHistory.currentIndex < s.navigationHistory.history.length - 1,
    }); }), hasStepBack = _a.hasStepBack, hasStepForward = _a.hasStepForward;
    return (<m.div layout="position" className={(0, patterns_1.hstack)({
            gap: '0.5',
        })}>
      <_common_1.PanelActionIcon disabled={!hasStepBack} onClick={function (e) {
            e.stopPropagation();
            diagram.navigate('back');
        }}>
        <icons_react_1.IconArrowLeft size={14}/>
      </_common_1.PanelActionIcon>
      <_common_1.PanelActionIcon disabled={!hasStepForward} onClick={function (e) {
            e.stopPropagation();
            diagram.navigate('forward');
        }}>
        <icons_react_1.IconArrowRight size={14}/>
      </_common_1.PanelActionIcon>
    </m.div>);
};
exports.NavigationButtons = NavigationButtons;
