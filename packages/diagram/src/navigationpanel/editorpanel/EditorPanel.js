"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorPanel = EditorPanel;
var patterns_1 = require("@likec4/styles/patterns");
var core_1 = require("@mantine/core");
var react_1 = require("motion/react");
var m = require("motion/react-m");
var context_1 = require("../../context");
var CenterCamera_1 = require("./CenterCamera");
var ChangeAutoLayoutButton_1 = require("./ChangeAutoLayoutButton");
var ManualLayoutToolsButton_1 = require("./ManualLayoutToolsButton");
var ToggleReadonly_1 = require("./ToggleReadonly");
function EditorPanel() {
    var enableReadOnly = (0, context_1.useEnabledFeatures)().enableReadOnly;
    return (<react_1.AnimatePresence>
      {!enableReadOnly && (<m.div layout="position" className={(0, patterns_1.vstack)({
                gap: 'xs',
                layerStyle: 'likec4.panel',
                position: 'relative',
                cursor: 'pointer',
                padding: 'xxs',
                pointerEvents: 'all',
            })} initial={{
                opacity: 0,
                translateX: -20,
            }} animate={{
                opacity: 1,
                translateX: 0,
            }} exit={{
                opacity: 0,
                translateX: -20,
            }}>
          <core_1.TooltipGroup openDelay={600} closeDelay={120}>
            <ChangeAutoLayoutButton_1.ChangeAutoLayoutButton />
            <ManualLayoutToolsButton_1.ManualLayoutToolsButton />
            <CenterCamera_1.CenterCamera />
            <ToggleReadonly_1.ToggleReadonly />
          </core_1.TooltipGroup>
        </m.div>)}
    </react_1.AnimatePresence>);
}
