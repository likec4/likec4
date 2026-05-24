import { actionBtn, actionButtons } from './actionBtn.ts'
import { compoundNode } from './compoundNode.ts'
import { edgeActionBtn } from './edgeActionBtn.ts'
import { edgeLabel } from './edgeLabel.ts'
import { edgePath } from './edgePath.ts'
import { elementNode } from './elementNode.ts'
import { elementNodeData } from './elementNodeData.ts'
import { elementShapeRecipe } from './elementShape.ts'
import { idBadge } from './idbadge.ts'
import { likec4tag } from './likec4tag.ts'
import { markdownBlock } from './markdownBlock.ts'
import { navigationPanelActionIcon } from './navigationPanelActionIcon.ts'
import { nodeNotes } from './nodeNotes.ts'
import { overlay } from './overlay.ts'

export const recipes = {
  actionBtn,
  actionButtons,
  compoundNode,
  edgeActionBtn,
  edgeLabel,
  edgePath,
  elementNode,
  elementNodeData,
  elementShapeRecipe,
  idBadge,
  likec4tag,
  markdownBlock,
  navigationPanelActionIcon,
  nodeNotes,
  overlay,
} as const
