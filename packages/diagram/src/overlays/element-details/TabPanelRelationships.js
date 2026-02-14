"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabPanelRelationships = TabPanelRelationships;
var core_1 = require("@likec4/core");
var core_2 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("@xstate/react");
var react_2 = require("react");
var remeda_1 = require("remeda");
var hooks_1 = require("../../hooks");
var RelationshipsBrowser_1 = require("../relationships-browser/RelationshipsBrowser");
var actorContext_1 = require("./actorContext");
var css = require("./TabPanelRelationships.css");
var Tooltip = core_2.Tooltip.withProps({
    color: 'dark',
    fz: 'xs',
    openDelay: 600,
    closeDelay: 120,
    label: '',
    children: null,
    offset: 8,
    withinPortal: false,
});
function TabPanelRelationships(_a) {
    var node = _a.node, element = _a.element;
    var diagram = (0, hooks_1.useDiagram)();
    var delailsActor = (0, actorContext_1.useElementDetailsActorRef)();
    var relationshipsBrowserActor = (0, react_1.useSelector)(delailsActor, (0, react_2.useCallback)(function (s) { return s.children["".concat(delailsActor.id, "-relationships")]; }, [delailsActor.id]));
    var incoming = __spreadArray([], element.incoming(), true).map(function (r) { return r.id; });
    var outgoing = __spreadArray([], element.outgoing(), true).map(function (r) { return r.id; });
    var incomingInView = node ? (0, remeda_1.unique)(__spreadArray([], node.incoming(), true).flatMap(function (e) { return e.$edge.relations; })) : [];
    var outgoingInView = node ? (0, remeda_1.unique)(__spreadArray([], node.outgoing(), true).flatMap(function (e) { return e.$edge.relations; })) : [];
    var notIncludedRelations = __spreadArray(__spreadArray([], incoming, true), outgoing, true).filter(function (r) { return !incomingInView.includes(r) && !outgoingInView.includes(r); }).length;
    return (<core_2.Stack gap={'xs'} pos={'relative'} w={'100%'} h={'100%'}>
      {(incoming.length + outgoing.length) > 0 && (<core_2.Group gap={'xs'} wrap="nowrap" align="center">
          <core_2.Box>
            <core_2.Group gap={8} mb={4} wrap="nowrap">
              <RelationshipsStat title="incoming" total={incoming.length} included={incomingInView.length}/>
              <core_2.ThemeIcon size={'sm'} variant="transparent" c="dimmed">
                <icons_react_1.IconArrowRight style={{ width: 16 }}/>
              </core_2.ThemeIcon>
              <core_2.Text className={css.fqn}>{(0, core_1.nameFromFqn)(element.id)}</core_2.Text>
              <core_2.ThemeIcon size={'sm'} variant="transparent" c="dimmed">
                <icons_react_1.IconArrowRight style={{ width: 16 }}/>
              </core_2.ThemeIcon>
              <RelationshipsStat title="outgoing" total={outgoing.length} included={outgoingInView.length}/>
            </core_2.Group>
          </core_2.Box>
          {notIncludedRelations > 0 && (<Tooltip label="Current view does not include some relationships">
              <core_2.Group mt={'xs'} gap={6} c="orange" style={{ cursor: 'pointer' }}>
                <icons_react_1.IconInfoCircle style={{ width: 14 }}/>
                <core_2.Text fz="sm">
                  {notIncludedRelations} relationship{notIncludedRelations > 1 ? 's are' : ' is'} hidden
                </core_2.Text>
              </core_2.Group>
            </Tooltip>)}
        </core_2.Group>)}

      <core_2.Box className={css.xyflow}>
        {relationshipsBrowserActor && (<>
            <RelationshipsBrowser_1.RelationshipsBrowser actorRef={relationshipsBrowserActor}/>
            <core_2.Box pos={'absolute'} top={12} right={12}>
              <core_2.ActionIcon size="md" variant="default" radius="sm" onClick={function (e) {
                e.stopPropagation();
                var _a = relationshipsBrowserActor.getSnapshot().context, subject = _a.subject, scope = _a.scope, viewId = _a.viewId;
                diagram.overlays().send({
                    type: 'open.relationshipsBrowser',
                    subject: subject,
                    scope: scope,
                    viewId: viewId,
                });
            }}>
                <icons_react_1.IconExternalLink stroke={1.6} style={{ width: '70%' }}/>
              </core_2.ActionIcon>
            </core_2.Box>
          </>)}
      </core_2.Box>
    </core_2.Stack>);
}
function RelationshipsStat(_a) {
    var title = _a.title, total = _a.total, included = _a.included;
    return (<core_2.Paper withBorder shadow="none" className={css.relationshipStat} px="md" py="xs" radius="md" mod={{
            zero: total === 0,
            missing: total !== included,
        }}>
      <core_2.Stack gap={4} align="flex-end">
        <core_2.Text component="div" c={total !== included ? 'orange' : 'dimmed'} tt="uppercase" fw={600} fz={10} lh={1}>
          {title}
        </core_2.Text>
        <core_2.Text fw={600} fz={'xl'} component="div" lh={1}>
          {total !== included
            ? (<>
                {included} / {total}
              </>)
            : (<>
                {total}
              </>)}
        </core_2.Text>
        {
        /* <ThemeIcon
        color="gray"
        variant="light"
        style={{
          color: stat.diff > 0 ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-red-6)'
        }}
        size={38}
        radius="md"
      >
        <DiffIcon size="1.8rem" stroke={1.5} />
      </ThemeIcon> */
        }
      </core_2.Stack>
      {
        /* <Text c="dimmed" fz="sm" mt="md">
          <Text component="span" c={stat.diff > 0 ? 'teal' : 'red'} fw={700}>
            {stat.diff}%
          </Text>{' '}
          {stat.diff > 0 ? 'increase' : 'decrease'} compared to last month
        </Text> */
        }
    </core_2.Paper>);
}
