---
'@likec4/language-server': patch
'@likec4/language-services': patch
'likec4': patch
---

`LikeC4.fromWorkspace` and the Vite plugin accept `includeProjects` (a project id or a list of ids) to limit the instance to these projects. The whole workspace is still parsed, so imports from other projects keep working. With a single project, it is used when no project is given, and sources outside of every project belong to it.

The Vite plugin accepts a ready `LikeC4` instance with the new `likec4` option, which respects included projects. The `languageServices` option is deprecated.

CLI commands with `--project` now load the workspace limited to that project, and accept the path to the project folder in every command. Sources outside of every project are now part of the selected project.

`ProjectsManager.defaultProjectId` can no longer be set; pass `workspaceSettings.includeProjects` when creating the language services instead.
