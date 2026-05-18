// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

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

const edgeRelationSchema = z.object({
  id: z.string().meta({ description: 'Relationship ID' }),
  source: z.string().meta({ description: 'Source model element or deployment reference' }),
  target: z.string().meta({ description: 'Target model element or deployment reference' }),
  title: z.string().nullish().meta({ description: 'Relationship label/title' }),
  technology: z.string().nullish().meta({ description: 'Relationship technology/kind label' }),
  metadata: z.record(z.string(), z.string()).nullish().meta({
    description: 'Relationship metadata as string values, for example datatype, src_port, and dst_port',
  }),
})

export type EdgeRelationData = z.infer<typeof edgeRelationSchema>

const edgeSchema = z.object({
  id: z.string().meta({ description: 'Edge ID in the current view' }),
  source: z.string().meta({ description: 'Source node ID in the current view' }),
  target: z.string().meta({ description: 'Target node ID in the current view' }),
  label: z.string().nullish().meta({ description: 'Visible edge label' }),
  technology: z.string().nullish().meta({ description: 'Visible edge technology label' }),
  relations: z.array(edgeRelationSchema).nullish().meta({
    description: 'Underlying relationships represented by this view edge',
  }),
})

export type EdgeData = z.infer<typeof edgeSchema>

const viewSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    type: z.enum(['element', 'deployment', 'dynamic']).meta({ description: 'Type of the current view' }),
  })
  .meta({ description: 'Current view' })

const linkSchema = z.object({
  url: z.string(),
  title: z.string().nullish(),
})

const elementRefSchema = z.object({
  id: z.string().meta({ description: 'Model element FQN' }),
  title: z.string(),
  kind: z.string(),
  technology: z.string().nullish(),
})

const elementRelationshipSchema = z.object({
  id: z.string().meta({ description: 'Relationship ID' }),
  source: elementRefSchema,
  target: elementRefSchema,
  title: z.string().nullish(),
  technology: z.string().nullish(),
  metadata: z.record(z.string(), z.string()).nullish(),
  links: z.array(linkSchema).nullish(),
})

const elementContextSchema = z.object({
  id: z.string().meta({ description: 'Model element FQN' }),
  title: z.string(),
  kind: z.string(),
  technology: z.string().nullish(),
  summary: z.string().nullish(),
  description: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  links: z.array(linkSchema).nullish(),
  metadata: z.record(z.string(), z.string()).nullish(),
  parent: elementRefSchema.nullish(),
  children: z.array(elementRefSchema).nullish(),
  incoming: z.array(elementRelationshipSchema).nullish(),
  outgoing: z.array(elementRelationshipSchema).nullish(),
  alsoAppearsInViews: z.array(viewSchema).nullish(),
})

export type ElementContextData = z.infer<typeof elementContextSchema>

export const readUiStateDef = toolDefinition({
  name: 'read_ui',
  description:
    'Read current UI state. Use nodes for element questions. Use edges for connection/input/output questions. Use edgeRelations for relationship metadata such as datatypes and ports.',
  needsApproval: false,
  inputSchema: z.object({
    selectedNode: z.boolean().default(false).meta({ description: 'Include selected node (if any)' }),
    nodes: z.boolean().default(false).meta({ description: 'Include all nodes from the view' }),
    edges: z.boolean().default(false).meta({
      description: 'Include all edges from the current view',
    }),
    edgeRelations: z.boolean().default(false).meta({
      description: 'Include underlying relationship details and metadata for returned edges. Implies edges.',
    }),
  }),
  outputSchema: z.object({
    projectId: z.string(),
    editMode: z.boolean().meta({ description: 'Whether the UI is in edit mode' }),
    view: viewSchema,
    nodes: z.array(nodeSchema).nullish(),
    edges: z.array(edgeSchema).nullish(),
    selectedNode: nodeSchema.nullish(),
  }),
})

export const readConnectionsDef = toolDefinition({
  name: 'read_connections',
  description:
    'Read current view connections/edges including underlying relationship metadata. Use for questions about inputs, outputs, datatypes, ports, and connection metadata.',
  needsApproval: false,
  inputSchema: z.object({}),
  outputSchema: z.object({
    projectId: z.string(),
    view: viewSchema,
    edges: z.array(edgeSchema),
  }),
})

export const readElementDef = toolDefinition({
  name: 'read_element',
  description:
    'Read rich model context for an element. If elementId is omitted, reads the selected or focused element.',
  needsApproval: false,
  inputSchema: z.object({
    elementId: z.string().min(1).nullish().meta({
      description: 'Model element FQN. If omitted, selected or focused element is used.',
    }),
  }),
  outputSchema: z.object({
    projectId: z.string(),
    view: viewSchema,
    element: elementContextSchema.nullish(),
    reason: z.string().nullish(),
  }),
})

export const updateUiStateDef = toolDefinition({
  name: 'update_ui',
  description: 'Update UI state by executing a command.',
  needsApproval: false,
  inputSchema: z.object({
    command: z
      .object({
        type: z.enum(['focus', 'fitview']).meta({
          description:
            'Command to execute. "focus" requires elementId. "fitview" zooms out and clears selection/focus.',
        }),
        elementId: z.string().min(1).nullish().meta({
          description: 'Element ID (FQN), required for focus commands.',
        }),
      })
      .superRefine((command, ctx) => {
        if (command.type === 'focus' && !command.elementId) {
          ctx.addIssue({
            code: 'custom',
            message: 'elementId is required for focus commands',
            path: ['elementId'],
          })
        }
      }),
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
