import { type IteratorLike, type ProjectId } from '@likec4/core'
import { loggable } from '@likec4/log'
import { flatMap } from 'remeda'
import stripIndent from 'strip-indent'
import { z } from 'zod'
import type { LikeC4LanguageServices } from '../LikeC4LanguageServices'
import { logger as mainLogger } from '../logger'
import { toSingleLine } from '../model/parser/Base'
import type { LikeC4Services } from '../module'
import { ProjectsManager } from '../workspace/ProjectsManager'
import { elementResource, modelViewResource } from './utils'

const logger = mainLogger.getChild('LikeC4MCPServices')

function singleLine<T extends string | undefined | null>(str: T) {
  const res = toSingleLine(str)?.replaceAll('"', '\'')
  return res ? `"${res}"` : 'null'
}

function outputEach<T>(
  iterator: IteratorLike<T>,
  ifEmpty: string,
  output: (item: T) => string[],
) {
  const items = [...iterator]
  if (items.length === 0) {
    return [ifEmpty]
  }
  return flatMap(items, output)
}

export namespace LikeC4MCPTools {
  export const instructions = `This server provides access to LikeC4 model.

Key capabilities:
- List all available LikeC4 projects in the workspace
- Search for LikeC4 project and return its summary, that includes specifications, all elements and views
- Search for LikeC4 element by title
- Read details about LikeC4 element by id
- Read details about LikeC4 view by id

`

  export const listProjects = {
    name: 'list-projects',
    description: 'Lists all available LikeC4 projects in the workspace',
  }

  export const readProjectSummary = {
    name: 'read-project-summary',
    description: stripIndent(`
      Searches for LikeC4 project and returns its summary, specifications, elements and views

      Args:
        project: Project name
    `),
    paramsSchema: {
      project: z.string().optional(),
    },
  }

  export const searchElement = {
    name: 'search-element',
    description: stripIndent(`
      Search for LikeC4 elements that have the search string in their names
      Can be used to resolve projects for further requests (like read-element or read-project-summary)

      Args:
        search: non-empty string
    `),
    paramsSchema: {
      search: z.string(),
    },
  }

  export const readElement = {
    name: 'read-element',
    description: stripIndent(`
      Read details about a LikeC4 element

      Args:
        id: Element id (FQN)
        project: Project name (optional, will use default project if not specified)
    `),
    paramsSchema: {
      id: z.string().min(1),
      project: z.string().optional(),
    },
  }

  export const readView = {
    name: 'read-view',
    description: stripIndent(`
      Read details about a LikeC4 view

      Args:
        id: View id
        project: Project name (optional, will use default project if not specified)
    `),
    paramsSchema: {
      id: z.string().min(1),
      project: z.string().optional(),
    },
  }
}

export interface LikeC4MCPTools {
  listProjects(): Promise<string>

  /**
   * Searches for LikeC4 project and returns its summary, specifications, elements and views
   *
   * @param project Project name (optional, will use default project if not specified)
   */
  readProjectSummary(project?: string): Promise<string>

  /**
   * Searches for LikeC4 elements that have the search string in their names
   * Can be used to resolve projects for further requests (like read-element or read-project-summary)
   *
   * @param params.search non-empty string
   */
  searchElement(params: { search: string }): Promise<string>

  /**
   * Read details about LikeC4 element.
   *
   * @param params.id Element id (FQN)
   * @param params.project Project name (optional, will use default project if not specified)
   */
  readElement(params: { id: string; project?: string | undefined }): Promise<string>

  /**
   * Read details about LikeC4 view.
   *
   * @param params.id View id (FQN)
   * @param params.project Project name (optional, will use default project if not specified)
   */
  readView(params: { id: string; project?: string | undefined }): Promise<string>
}

export class DefaultLikeC4MCPTools implements LikeC4MCPTools {
  private readonly languageServices: LikeC4LanguageServices

  constructor(private services: LikeC4Services) {
    this.languageServices = services.likec4.LanguageServices
  }

  async listProjects(): Promise<string> {
    const projects = await this.languageServices.projects()
    const response = [] as string[]
    for (const project of projects) {
      if (!project.documents) {
        continue
      }
      response.push(
        `<likec4project>`,
        `id: "${project.id}"`,
        `folder: ${project.folder.toString()}`,
        'sources:',
        ...project.documents.map(d => `- ${d.toString()}`),
        '',
      )
      try {
        const model = await this.languageServices.computedModel(project.id)
        const elements = [...model.elements()]
        if (elements.length > 0) {
          response.push(
            'elements:',
            ...elements.flatMap(el => [
              `- id: ${el.id}`,
              `  kind: ${el.kind}`,
              `  title: ${singleLine(el.title)}`,
              '',
            ]),
            '',
          )
        }
        const views = [...model.views()]
        if (views.length > 0) {
          response.push(
            'views:',
            ...views.flatMap(v => [
              `- id: ${v.id}`,
              `  title: ${singleLine(v.title)}`,
              '',
            ]),
            '',
          )
        }
      } catch (error) {
        logger.error(loggable(error))
      }
      response.push(`</likec4project>`)
    }

    if (response.length === 0) {
      response.push(
        `<likec4project>`,
        `id: "default"`,
        `folder: ${this.languageServices.workspaceUri.toString()}`,
        `</likec4project>`,
      )
    }

    return response.join('\n')
  }

  async readProjectSummary(_project?: ProjectId): Promise<string> {
    const projectId = _project ?? ProjectsManager.DefaultProjectId
    const project = this.languageServices.projects().find(p => p.id === projectId)
    if (!project) {
      return 'Project not found'
    }
    const model = await this.languageServices.computedModel(project.id)
    const response = [
      `project: "${project.id}"`,
      `folder: ${project.folder.toString()}`,
    ]
    if (project.documents) {
      response.push(
        'sources:',
        ...project.documents.map(d => `- ${d.toString()}`),
        '',
      )
    }
    // Write specifications
    response.push('<specifications>')
    const elementKinds = Object.keys(model.$model.specification.elements)
    if (elementKinds.length > 0) {
      response.push(
        'element kinds:',
        ...elementKinds.map(kind => `- ${kind}`),
        '',
      )
    }
    const relationshipKinds = Object.keys(model.$model.specification.relationships)
    if (relationshipKinds.length > 0) {
      response.push(
        'relationship kinds:',
        ...relationshipKinds.map(kind => `- ${kind}`),
        '',
      )
    }
    const deploymentKinds = Object.keys(model.$model.specification.deployments)
    if (deploymentKinds.length > 0) {
      response.push(
        'deployment node kinds:',
        ...deploymentKinds.map(kind => `- ${kind}`),
        '',
      )
    }
    const tags = model.tags
    if (tags.length > 0) {
      response.push(
        'tags:',
        ...tags.map(t => `- ${t}`),
        '',
      )
    }
    response.push(
      '</specifications>',
      '',
    )

    response.push(
      '<elements>',
      ...outputEach(model.elements(), 'No elements', el => [
        `- id: ${el.id}`,
        ...(el.parent
          ? [
            `  parentId: ${el.parent.id}`,
          ]
          : []),
        `  kind: ${el.kind}`,
        `  shape: ${el.shape}`,
        `  title: ${singleLine(el.title)}`,
        `  description: ${singleLine(el.description)}`,
        `  technology: ${singleLine(el.technology)}`,
        `  tags: ${JSON.stringify(el.tags)}`,
        '',
      ]),
      '</elements>',
      '<views>',
      ...outputEach(model.views(), 'No views', v => [
        `- id: ${v.id}`,
        `  viewType: ${v.__}`,
        `  title: ${singleLine(v.title)}`,
        '',
      ]),
      '</views>',
    )

    return response.join('\n')
  }

  async searchElement(params: { search: string }): Promise<string> {
    const search = params.search.toLowerCase()
    const found = [] as string[]

    for (const project of this.languageServices.projects()) {
      try {
        const model = await this.languageServices.computedModel(project.id)
        const elements = [...model.elements()].filter(el => el.title.toLowerCase().includes(search))
        if (elements.length > 0) {
          found.push(
            '<project>',
            `project: "${project.id}"`,
            'found:',
            ...elements.flatMap(el => [
              `- id: ${el.id}`,
              `  kind: ${el.kind}`,
              `  title: ${singleLine(el.title)}`,
              '',
            ]),
            '</project>',
          )
        }
      } catch (error) {
        logger.error(loggable(error))
      }
    }
    return found.length > 0 ? found.join('\n') : 'No elements with this name found'
  }

  async readElement(params: { id: string; project?: string }): Promise<string> {
    const projectId = params.project ?? ProjectsManager.DefaultProjectId
    const project = this.languageServices.projects().find(p => p.id === projectId)
    if (!project) {
      return `Project "${projectId}" not found`
    }
    const model = await this.languageServices.computedModel(project.id)
    const element = model.findElement(params.id)
    if (!element) {
      return `Element "${params.id}" not found in project "${projectId}"`
    }
    return JSON.stringify(elementResource(this.languageServices, element, project.id))
  }

  async readView(params: { id: string; project?: string }): Promise<string> {
    const projectId = params.project ?? ProjectsManager.DefaultProjectId
    const project = this.languageServices.projects().find(p => p.id === projectId)
    if (!project) {
      return `Project "${projectId}" not found`
    }
    const model = await this.languageServices.computedModel(project.id)
    const view = model.findView(params.id)
    if (!view) {
      return `View "${params.id}" not found in project "${projectId}"`
    }
    return JSON.stringify(modelViewResource(this.languageServices, view, project.id))
  }
}
