import { invariant } from '@likec4/core'
import z from 'zod'
import { ProjectsManager } from '../../workspace'
import { likec4Tool } from '../utils'

export const openView = likec4Tool({
  name: 'open-view',
  description: `
Opens the panel with the LikeC4 view in the editor.
Only one view can be opened at a time.
`.trimStart(),
  annotations: {
    readOnlyHint: true,
  },
  inputSchema: {
    viewId: z.string().describe('View id (name)'),
    project: z.string().optional().describe('Project name (optional, will use "default" if not specified)'),
  },
}, async (languageServices, args) => {
  const projectId = args.project ?? ProjectsManager.DefaultProjectId
  const project = languageServices.projects().find(p => p.id === projectId)
  invariant(project, `Project "${projectId}" not found`)
  const model = await languageServices.computedModel(project.id)
  const view = model.findView(args.viewId)

  if (!view) {
    throw new Error(`View with ID '${args.viewId}' not found in project ${project.id}`)
  }
  await languageServices.views.openView(view.id, project.id)
  return `Command was sent to the editor to open the view "${view.id}"` as any
})
