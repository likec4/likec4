"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementsTree = void 0;
var utils_1 = require("@likec4/core/utils");
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var react_1 = require("@zag-js/react");
var react_2 = require("react");
var Tree_1 = require("./components/Tree");
var panel_1 = require("./state/panel");
var useElementsTree_1 = require("./useElementsTree");
exports.ElementsTree = (0, react_2.memo)(function () {
    var api = (0, useElementsTree_1.useElementsTree)();
    var onClick = (0, panel_1.useEditorPanelTrigger)(function (trigger, event) {
        var _a;
        var id = (_a = event.currentTarget.closest('[data-value]')) === null || _a === void 0 ? void 0 : _a.getAttribute('data-value');
        if (!id) {
            return;
        }
        try {
            event.stopPropagation();
            event.preventDefault();
            api.expand([id]);
            trigger.elementClick({ id: id });
        }
        catch (err) {
            console.error('Failed to handle element click', err);
        }
    });
    var rootProps = (0, react_1.mergeProps)(api.getRootProps(), {
        onKeyDown: function (e) {
            switch (e.key) {
                case 'Escape': {
                    var input = document.getElementById('search-input');
                    if (input) {
                        e.stopPropagation();
                        e.preventDefault();
                        input.focus();
                    }
                    break;
                }
                case 'ArrowUp': {
                    console.log('ArrowUp', {
                        selected: api.selectedValue,
                    });
                    // e.stopPropagation()
                    // e.preventDefault()
                    break;
                }
                default: {
                    console.log(e.key);
                    return;
                }
            }
        },
        // onClick: useCallbackRef((e: MouseEvent) => {
        //   const lastnd = last(api.getVisibleNodes())
        //   if (lastnd) {
        //     e.stopPropagation()
        //     api.focus(lastnd.node.id)
        //   }
        // }),
    });
    return (<core_1.ScrollArea flex="1 1 100%" scrollbars="y" type="scroll" scrollbarSize={'4px'} {...rootProps}>
      <Tree_1.Tree.Root {...api.getTreeProps()}>
        {api.collection.rootNode.children.map(function (node, index) { return (<TreeNode key={node.id} node={node} api={api} 
        // indexPath={[index]}
        onClick={onClick}/>); })}
        {!api.collection.getFirstNode() && (<jsx_1.Box css={{
                p: '4',
                textAlign: 'center',
            }}>
            Nothing found
          </jsx_1.Box>)}
      </Tree_1.Tree.Root>
    </core_1.ScrollArea>);
});
var TreeNode = function (_a) {
    var api = _a.api, node = _a.node, onClick = _a.onClick;
    var indexPath = api.collection.getIndexPath(node.id);
    (0, utils_1.invariant)(indexPath, 'Node not found in collection');
    var nodeProps = { indexPath: indexPath, node: node };
    var state = api.getNodeState(nodeProps);
    if (state.isBranch) {
        // const indeterminate = state.checked === 'indeterminate'
        return (<Tree_1.Tree.Branch {...api.getBranchProps(nodeProps)}>
        <Tree_1.Tree.Control {...api.getBranchControlProps(nodeProps)}>
          <Tree_1.Tree.Icon element={node}/>
          <Tree_1.Tree.Label {...api.getBranchTextProps(nodeProps)}>
            {node.title}
            <Tree_1.Tree.Indicator {...api.getBranchIndicatorProps(nodeProps)}/>
          </Tree_1.Tree.Label>
          <Tree_1.Tree.State node={node} state={node.state} onClick={onClick}/>
        </Tree_1.Tree.Control>
        <Tree_1.Tree.Content {...api.getBranchContentProps(nodeProps)}>
          {state.expanded && node.children.map(function (childNode, index) { return (<TreeNode key={childNode.id} node={childNode} 
            // indexPath={[...indexPath, index]}
            api={api} onClick={onClick}/>); })}
        </Tree_1.Tree.Content>
      </Tree_1.Tree.Branch>);
    }
    // const { onClick, ...itemsProps } =
    return (<Tree_1.Tree.Item {...api.getItemProps(nodeProps)}>
      <Tree_1.Tree.Icon element={node}/>
      <Tree_1.Tree.Label {...api.getItemTextProps(nodeProps)}>
        {node.title}
      </Tree_1.Tree.Label>
      <Tree_1.Tree.State node={node} state={node.state} onClick={onClick}/>
    </Tree_1.Tree.Item>);
};
