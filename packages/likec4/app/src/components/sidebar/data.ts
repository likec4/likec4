import { useStore } from '@nanostores/react'
import { batched } from 'nanostores'
import { values } from 'remeda'
import { $views } from 'virtual:likec4'
import { buildDiagramTreeAtom } from './sidebar-diagram-tree'

const $diagramsTree = batched($views, views => buildDiagramTreeAtom(values(views)))

export function useDiagramsTree() {
  return useStore($diagramsTree)
}
