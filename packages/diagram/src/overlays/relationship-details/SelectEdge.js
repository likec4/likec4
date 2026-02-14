"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectEdge = void 0;
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
var hooks_1 = require("./hooks");
var css = require("./SelectEdge.css");
var SelectEdge = function (_a) {
    var edge = _a.edge, view = _a.view;
    var browser = (0, hooks_1.useRelationshipDetails)();
    var viewport = (0, react_1.useRef)(null);
    var edgeSource = view.nodes.find(function (n) { return n.id === edge.source; });
    var edgeTarget = view.nodes.find(function (n) { return n.id === edge.target; });
    var edges = view.edges.flatMap(function (edge) {
        var source = view.nodes.find(function (n) { return n.id === edge.source; });
        var target = view.nodes.find(function (n) { return n.id === edge.target; });
        if (source && target) {
            return {
                id: edge.id,
                source: source,
                target: target,
                label: edge.label,
            };
        }
        return [];
    });
    if (!edgeSource || !edgeTarget || edges.length === 0) {
        return null;
    }
    return (<core_1.Popover position="bottom-start" shadow="md" keepMounted withinPortal={false} closeOnClickOutside clickOutsideEvents={['pointerdown', 'mousedown', 'click']} onOpen={function () {
            setTimeout(function () {
                var _a;
                var item = (_a = viewport.current) === null || _a === void 0 ? void 0 : _a.querySelector("[data-edge-id=\"".concat(edge.id, "\"]"));
                item === null || item === void 0 ? void 0 : item.scrollIntoView({ behavior: 'instant', block: 'nearest' });
            }, 100);
        }}>
      <core_1.PopoverTarget>
        <core_1.Button size="xs" variant="default" fw={'500'} style={{ padding: '0.25rem 0.75rem' }} rightSection={<icons_react_1.IconSelector size={16}/>}>
          <core_1.Box className={css.edgeSource} maw={160} p={0} mod={{
            'likec4-color': edgeSource.color,
        }}>
            <core_1.Text component="span" truncate>{edgeSource.title}</core_1.Text>
          </core_1.Box>
          <core_1.ThemeIcon color="dark" variant="transparent" size={'xs'}>
            <icons_react_1.IconArrowRight style={{ width: '80%' }}/>
          </core_1.ThemeIcon>
          <core_1.Box className={css.edgeTarget} maw={160} p={0} mod={{
            'likec4-color': edgeTarget.color,
        }}>
            <core_1.Text component="span" truncate>{edgeTarget.title}</core_1.Text>
          </core_1.Box>
        </core_1.Button>
      </core_1.PopoverTarget>
      <core_1.PopoverDropdown p={0} miw={250} maw={400}>
        <core_1.ScrollAreaAutosize className={css.scrollArea} scrollbars="y" type="never" viewportRef={viewport}>
          <core_1.Box className={css.edgeGrid} p="xs" maw={400}>
            {edges.map(function (e) { return (<div key={e.id} className={css.edgeRow} data-selected={e.id === edge.id} onClick={function (event) {
                event.stopPropagation();
                browser.navigateTo(e.id);
            }}>
                <core_1.Box className={css.edgeSource} mod={{
                'edge-id': e.id,
                'likec4-color': e.source.color,
            }}>
                  <core_1.Text component="span" truncate>{e.source.title}</core_1.Text>
                </core_1.Box>
                <core_1.Box className={css.edgeArrow}>
                  <core_1.ThemeIcon color="dark" variant="transparent" size={'xs'}>
                    <icons_react_1.IconArrowRight style={{ width: '80%' }}/>
                  </core_1.ThemeIcon>
                </core_1.Box>
                <core_1.Box className={css.edgeTarget} mod={{
                'likec4-color': e.target.color,
            }}>
                  <core_1.Text component="span" truncate>{e.target.title}</core_1.Text>
                </core_1.Box>
                <core_1.Box className={css.edgeLabel}>
                  <core_1.Text component="span" truncate>{e.label || 'untitled'}</core_1.Text>
                </core_1.Box>
              </div>); })}
          </core_1.Box>
        </core_1.ScrollAreaAutosize>
      </core_1.PopoverDropdown>
    </core_1.Popover>);
};
exports.SelectEdge = SelectEdge;
