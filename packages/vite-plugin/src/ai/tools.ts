import { ElementShapes } from '@likec4/core/styles'
import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'

const nodeSchema = z.object({
  id: z.string().meta({ description: 'Node ID' }),
  title: z.string(),
  shape: z.enum(ElementShapes),
  color: z.string().meta({ description: 'Node color, from theme or custom' }),
  icon: z.string().nullish(),
  parentId: z.string().nullish().meta({ description: 'Parent node ID (if node is nested)' }),
  children: z.array(z.string()).nullish().meta({ description: 'Nested node IDs (if node is compound)' }),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  modelFqn: z.string().nullish().meta({ description: 'Model element FQN (if node has reference)' }),
})

export type NodeData = z.infer<typeof nodeSchema>

export const readUiStateDef = toolDefinition({
  name: 'read_ui',
  description: 'Read current UI state. Use arguments to include additional data.',
  needsApproval: false,
  inputSchema: z.object({
    selectedNode: z.boolean().default(false).meta({ description: 'Include selected node (if any)' }),
    nodes: z.boolean().default(false).meta({ description: 'Include all nodes from the view' }),
  }),
  outputSchema: z.object({
    projectId: z.string(),
    editMode: z.boolean().meta({ description: 'Whether the UI is in edit mode' }),
    view: z
      .object({
        id: z.string(),
        title: z.string(),
        type: z.enum(['element', 'deployment', 'dynamic']).meta({ description: 'Type of the current view' }),
      })
      .meta({ description: 'Current view' }),
    nodes: z.array(nodeSchema).nullish(),
    selectedNode: nodeSchema.nullish(),
  }),
})

const focusCommand = z
  .object({
    type: z.literal('focus'),
    elementId: z.string().meta({ description: 'Element ID (FQN)' }),
  })
  .meta({
    description: 'Focus UI on an element by its FQN',
  })

const fitViewCommand = z
  .object({
    type: z.literal('fitview'),
  })
  .meta({
    description: 'Zoom out to fit all elements in the viewport, and clear any selection/focus',
  })

export const updateUiStateDef = toolDefinition({
  name: 'update_ui',
  description: 'Update UI state by executing a command.',
  needsApproval: false,
  inputSchema: z.object({
    command: z.discriminatedUnion('type', [
      focusCommand,
      fitViewCommand,
    ]),
  }),
  outputSchema: z.object({}),
})

export const navigateToDef = toolDefinition({
  name: 'navigate_to',
  description: 'Navigates UI to another view',
  needsApproval: false,
  inputSchema: z.object({
    viewId: z.string().meta({ description: 'View ID' }),
  }),
  outputSchema: z.object({}),
})
