// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { StepEdgeId } from '@likec4/core'
import { raise } from 'xstate/actions'
import { and, or } from 'xstate/guards'
import {
  assignFocusedNode,
  assignLastClickedNode,
  emitEdgeClick,
  emitNodeClick,
  emitOpenSourceOfView,
  emitPaneClick,
  openElementDetails,
  openSourceOfFocusedOrLastClickedNode,
  raiseFitDiagram,
  resetLastClickedNode,
} from './machine.actions'
import { machine, targetState, to } from './machine.setup'

export const idle = machine.createStateConfig({
  id: targetState.idle.slice(1),
  on: {
    'xyflow.nodeClick': [
      {
        guard: and([
          'enabled: Readonly',
          'enabled: FocusMode',
          'click: node has connections',
          or([
            'click: same node',
            'click: selected node',
          ]),
        ]),
        actions: [
          assignLastClickedNode(),
          assignFocusedNode(),
          emitNodeClick(),
        ],
        ...to.focused,
      },
      {
        guard: and([
          'enabled: Readonly',
          'enabled: ElementDetails',
          'click: node has modelFqn',
          or([
            'click: same node',
            'click: selected node',
          ]),
        ]),
        actions: [
          assignLastClickedNode(),
          openSourceOfFocusedOrLastClickedNode(),
          openElementDetails(),
          emitNodeClick(),
        ],
      },
      {
        actions: [
          assignLastClickedNode(),
          openSourceOfFocusedOrLastClickedNode(),
          emitNodeClick(),
        ],
      },
    ],
    'xyflow.paneClick': {
      actions: [
        resetLastClickedNode(),
        emitPaneClick(),
      ],
    },
    'xyflow.paneDblClick': {
      actions: [
        resetLastClickedNode(),
        raiseFitDiagram(),
        emitOpenSourceOfView(),
        emitPaneClick(),
      ],
    },
    'focus.node': [
      // Focus was initialed by the user searching (autoUnfocus=true) - always allowed
      {
        guard: 'focus.node: autoUnfocus',
        actions: assignFocusedNode(),
        target: targetState.focused,
      },
      // Regular focus - requires FocusMode to be enabled
      {
        guard: 'enabled: FocusMode',
        actions: assignFocusedNode(),
        target: targetState.focused,
      },
    ],
    'xyflow.edgeClick': {
      guard: and([
        'enabled: Readonly',
        'is dynamic view',
        'enabled: DynamicViewWalkthrough',
        'click: selected edge',
      ]),
      actions: [
        resetLastClickedNode(),
        raise(({ event }) => ({
          type: 'walkthrough.start',
          stepId: event.edge.id as StepEdgeId,
        })),
        emitEdgeClick(),
      ],
    },
  },
})
