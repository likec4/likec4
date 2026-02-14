"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorPanel = void 0;
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("motion/react");
var react_2 = require("react");
var remeda_1 = require("remeda");
var Logo_1 = require("../components/Logo");
var ElementsTree_1 = require("./ElementsTree");
var panel_1 = require("./state/panel");
var EditorPanel = function () {
    return (<panel_1.EditorPanelStoreProvider>
      <react_1.AnimatePresence mode="popLayout">
        <jsx_1.VStack css={{
            position: 'fixed',
            top: '0',
            left: '0',
            gap: '1',
            bottom: '0',
            height: 'auto',
            overflow: 'hidden',
            layerStyle: 'likec4.panel',
            width: '[300px]',
            rounded: '0',
        }} onClick={function (e) {
            e.stopPropagation();
            var input = document.getElementById('search-input');
            if (input) {
                input.focus();
            }
        }}>
          <jsx_1.HStack p={'2'} gap="4" justifyItems={'stretch'}>
            <Logo_1.Logo style={{ height: 16 }}/>
            <jsx_1.Txt size="sm" fontWeight="medium" flex={'1'}>
              Explore
            </jsx_1.Txt>
            <jsx_1.HStack gap="1">
              <core_1.ActionIcon>
                <icons_react_1.IconTrash />
              </core_1.ActionIcon>
            </jsx_1.HStack>
          </jsx_1.HStack>
          <jsx_1.Box>
            <SearchInput />
          </jsx_1.Box>
          <react_2.Suspense>
            <ElementsTree_1.ElementsTree />
          </react_2.Suspense>
        </jsx_1.VStack>
      </react_1.AnimatePresence>
    </panel_1.EditorPanelStoreProvider>);
};
exports.EditorPanel = EditorPanel;
var selectInput = (0, panel_1.selectEditorPanelState)((0, remeda_1.prop)('searchInput'));
function SearchInput() {
    var input = (0, panel_1.useEditorPanelState)(selectInput);
    var trigger = (0, panel_1.useEditorPanelTrigger)();
    var onChange = (0, panel_1.useEditorPanelTrigger)(function (trigger, event) {
        trigger.inputChange({ value: event.currentTarget.value });
    });
    var clear = (0, panel_1.useEditorPanelTrigger)(function (trigger) {
        trigger.inputChange({ value: '' });
    });
    return (<jsx_1.Box>
      <core_1.Input id="search-input" size="xs" variant="filled" placeholder="Search by title, description or start with # or kind:" value={input} onChange={onChange} data-likec4-search-input rightSectionPointerEvents="all" rightSection={<core_1.CloseButton size="sm" aria-label="Clear input" onClick={clear} style={{ display: input ? undefined : 'none' }}/>} onKeyDownCapture={function (e) {
            switch (e.key) {
                case 'Escape': {
                    e.stopPropagation();
                    e.preventDefault();
                    clear();
                    break;
                }
                case 'Enter': {
                    e.stopPropagation();
                    e.preventDefault();
                    // editor.close()
                    break;
                }
                case 'ArrowDown': {
                    e.stopPropagation();
                    e.preventDefault();
                    trigger.inputKeyDown();
                    break;
                }
                default: {
                    return;
                }
            }
        }}/>
    </jsx_1.Box>);
}
