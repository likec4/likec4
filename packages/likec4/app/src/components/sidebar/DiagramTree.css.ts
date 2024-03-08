import { globalStyle, style } from '@vanilla-extract/css'

export const treeview = style({
  // minWidth: '200px'
})

// globalStyle(`${treeview} ul`, {
//   listStyle: 'none',
//   padding: '0',
//   margin: '0',
//   display: 'flex',
//   flexDirection: 'column',
//   gap: 0
// })

// globalStyle(`${treeview} .tree-leaf-list-item`, {
//   paddingLeft: 14
// })
// export const treeBranchWrapper = style({
//   paddingLeft: 10,
//   marginTop: 4,
//   selectors: {
//     '&:has(> .tree-branch-wrapper)': {
//       paddingLeft: 0
//     }
//   }
// })
// // .tree-node-group--expanded {
//     margin-top: var(--space-1);
//     padding-left: var(--space-5);

//     &:has(> .tree-branch-wrapper) {
//       padding-left: var(--space-3);
//     }
//   }
