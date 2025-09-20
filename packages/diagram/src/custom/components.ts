import {
  CompoundActionButton,
  CompoundDetailsButton,
  CompoundNodeContainer,
  CompoundTitle,
  DefaultHandles,
  ElementActionButtons,
  ElementDetailsButton,
  ElementNodeContainer,
  ElementShape,
  ElementTag,
  ElementTags,
  ElementTitle,
  MarkdownBlock,
} from '../base/primitives'

export const Primitives = {
  CompoundActionButton,
  CompoundDetailsButton,
  CompoundNodeContainer,
  CompoundTitle,
  DefaultHandles,
  ElementActionButtons,
  ElementDetailsButton,
  ElementNodeContainer,
  ElementShape,
  ElementTag,
  ElementTags,
  ElementTitle,
  MarkdownBlock,
} as const

export {
  IconOrShapeRenderer,
  IconRenderer,
  IconRendererProvider,
} from '../context/IconRenderer'

import {
  CompoundActions,
  CompoundDeploymentNode,
  CompoundDeploymentToolbar,
  CompoundDetailsButtonWithHandler,
  CompoundElementNode,
  CompoundElementToolbar,
  DeploymentElementActions,
  DeploymentElementToolbar,
  DeploymentNode,
  ElementActions,
  ElementDetailsButtonWithHandler,
  ElementNode,
  ElementToolbar,
  Toolbar,
  ViewGroupNode,
} from '../likec4diagram/custom/nodes'

export const Default = {
  CompoundActions,
  CompoundDeploymentNode,
  CompoundDeploymentToolbar,
  CompoundDetailsButtonWithHandler,
  CompoundElementNode,
  CompoundElementToolbar,
  DeploymentElementActions,
  DeploymentElementToolbar,
  DeploymentNode,
  ElementActions,
  ElementDetailsButtonWithHandler,
  ElementNode,
  ElementToolbar,
  Toolbar,
  ViewGroupNode,
} as const

export {
  IfEnabled,
  IfNotEnabled,
  IfNotReadOnly,
  IfReadOnly,
} from '../context/DiagramFeatures'

export {
  Overlay,
  type OverlayProps,
} from '../overlays/overlay/Overlay'
