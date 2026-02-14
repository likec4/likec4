"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectNode = ProjectNode;
var hooks_1 = require("@mantine/hooks");
var icons_react_1 = require("@tabler/icons-react");
var base_primitives_1 = require("../../base-primitives");
var context_1 = require("../context");
function ProjectNode(props) {
    var actor = (0, context_1.useProjectsOverviewActor)();
    var navigateTo = (0, hooks_1.useCallbackRef)(function (e) {
        e.stopPropagation();
        actor.send({ type: 'navigate.to', fromNode: props.data.id, projectId: props.data.projectId });
    });
    return (<base_primitives_1.ElementNodeContainer key={props.id} layout nodeProps={props}>
      <base_primitives_1.ElementShape {...props}/>
      <base_primitives_1.ElementData {...props}/>
      <base_primitives_1.ElementActionButtons {...props} buttons={[
            {
                key: 'navigate',
                icon: <icons_react_1.IconZoomScan />,
                onClick: navigateTo,
            },
        ]}/>
      <base_primitives_1.DefaultHandles />
      {/* <ElementActions {...props} /> */}
    </base_primitives_1.ElementNodeContainer>);
}
