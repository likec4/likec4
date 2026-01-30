import type { ElementModel, LikeC4Model } from '@likec4/core/model'
import type { Fqn } from '@likec4/core/types'
import { toArray } from '@likec4/core/utils'
import type { TreeCollection } from '@zag-js/collection'
import * as tree from '@zag-js/tree-view'

export interface TreeNodeData {
  fqn: Fqn
  title: string
  children: TreeNodeData[]
}

function mapToTreeNodes(elements: Iterable<ElementModel>): TreeNodeData[] {
  return toArray(elements).map(el => ({
    fqn: el.id,
    title: el.title,
    children: mapToTreeNodes(el.children()),
  }))
}

export function createTreeCollection(model: LikeC4Model): TreeCollection<TreeNodeData> {
  return tree.collection<TreeNodeData>({
    rootNode: {
      fqn: '@ROOT' as Fqn,
      title: '',
      children: mapToTreeNodes(model.roots()),
    },
    nodeToValue(node) {
      return node.fqn
    },
    nodeToString(node) {
      return node.title
    },
  })
}

// export function useElementsTree() {
//   const likec4model = useLikeC4Model()

//   const [collection, setCollection] = useState(
//     () => createTreeCollection(likec4model),
//   )

//   const service = useMachine(tree.machine as tree.Machine<TreeNodeData>, {
//     id: useId(),
//     collection,
//     defaultSelectedValue: [],
//     // checkedValue,
//     defaultExpandedValue: [],
//     // defaultFocusedValue: null,
//     // onCheckedChange({ checkedValue }) {
//     //   setCheckedValue(checkedValue)
//     // },
//     // onSelectionChange({ focusedValue, selectedNodes }) {
//     //   const node = focusedValue ? selectedNodes.find(n => n.id === focusedValue) : null
//     //   if (!node) return
//     //   if (node.children.length > 0) {
//     //     const isExpanded = api.expandedValue.includes(node.id)
//     //     const isChecked = api.checkedValue.includes(node.id)
//     //     if (!isExpanded && !isChecked) {
//     //       api.toggleChecked(node.id, true)
//     //       api.expand([node.id])
//     //     }
//     //     return
//     //   }
//     //   api.toggleChecked(node.id, false)
//     // },
//   })

//   const api = tree.connect(service, normalizeProps)

//   return {
//     api,
//     service,
//     collection,
//   }
// }
