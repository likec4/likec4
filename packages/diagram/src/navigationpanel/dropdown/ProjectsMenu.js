"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsMenu = void 0;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
var useLikeC4Project_1 = require("../../hooks/useLikeC4Project");
exports.ProjectsMenu = (0, react_1.memo)(function (_) {
    var _a = (0, useLikeC4Project_1.useLikeC4ProjectsContext)(), projects = _a.projects, onProjectChange = _a.onProjectChange;
    if (projects.length <= 1) {
        return null;
    }
    return <WithProjectsMenu projects={projects} onProjectChange={onProjectChange}/>;
});
function WithProjectsMenu(_a) {
    var projects = _a.projects, onProjectChange = _a.onProjectChange;
    var projectId = (0, useLikeC4Project_1.useLikeC4ProjectId)();
    return (<jsx_1.HStack gap="0.5" alignItems="baseline">
      <jsx_1.Box css={{
            fontWeight: 'normal',
            fontSize: 'xxs',
            color: 'likec4.panel.text.dimmed',
            userSelect: 'none',
        }}>
        Project
      </jsx_1.Box>
      <core_1.Menu withinPortal={false} // if we render menu in portal, NavigationPanelDropdown receives onMouseLeave event
     shadow="md" position="bottom-start" offset={{ mainAxis: 2 }}>
        <core_1.MenuTarget>
          <core_1.Button tabIndex={-1} autoFocus={false} variant="subtle" size="compact-xs" color="gray" classNames={{
            root: (0, css_1.css)({
                fontWeight: 'normal',
                fontSize: 'xxs',
                height: 'auto',
                lineHeight: 1.1,
                color: {
                    _light: 'mantine.colors.gray[9]',
                },
            }),
            section: (0, css_1.css)({
                '&:is([data-position="right"])': {
                    marginInlineStart: '1',
                },
            }),
        }} rightSection={<icons_react_1.IconChevronDown opacity={0.5} size={12} stroke={1.5}/>}>
            {projectId}
          </core_1.Button>
        </core_1.MenuTarget>

        <core_1.MenuDropdown>
          {projects.map(function (_a) {
            var id = _a.id, title = _a.title;
            return (<core_1.MenuItem key={id} onClick={function (e) {
                    if (projectId === id) {
                        e.stopPropagation();
                        return;
                    }
                    onProjectChange(id);
                }}>
              {title !== null && title !== void 0 ? title : id}
            </core_1.MenuItem>);
        })}
        </core_1.MenuDropdown>
      </core_1.Menu>
    </jsx_1.HStack>);
}
