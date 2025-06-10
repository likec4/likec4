import { ref, useActiveTextEditor, useEditorDecorations, watch } from 'reactive-vscode'
import { first } from 'remeda'
import * as vscode from 'vscode'
import { logger as root } from '../logger'
import type { Rpc } from '../Rpc'

const logger = root.getChild('tag-decoration')

export function useTagDecoration() {
  // const t
}

export function activateTagDecoration(rpc: Rpc) {
  const decoration = ref(
    vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(17, 126, 73, 0.16)',
      border: '1px solid rgba(17, 126, 73, 0.5)',
      borderRadius: '2px',

      // overviewRulerColor: 'red',
      // overviewRulerLane: vscode.OverviewRulerLane.Center,
      rangeBehavior: vscode.DecorationRangeBehavior.OpenOpen,
      isWholeLine: false,
      // before: {
      //   contentText: 'TAG',
      //   color: '#A00',
      //   fontWeight: 'bold',
      //   margin: '0 2px',
      // },
      // light: {
      //   backgroundColor: 'transparent',
      //   border: '1px solid #A00',
      //   borderRadius: '2px',
      //   // overviewRulerColor: 'red',
      //   overviewRulerLane: vscode.OverviewRulerLane.Center,
      //   rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
      //   isWholeLine: false,
      // },
      // dark: {
      //   backgroundColor: 'transparent',
      //   border: '1px solid #A00',
      //   borderRadius: '2px',
      //   // overviewRulerColor: 'red',
      //   // overviewRulerLane: vscode.OverviewRulerLane.Center,
      //   rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
      //   isWholeLine: false,
      // },
    }),
  )

  const ranges = ref([] as vscode.Range[])

  const activeTextEditor = useActiveTextEditor()

  watch(activeTextEditor, async (editor) => {
    if (!editor) {
      return
    }
    const tags = await rpc.getDocumentTags({ documentUri: editor.document.uri.toString() })
    const firstTag = first(tags)!
    decoration.value = vscode.window.createTextEditorDecorationType({
      backgroundColor: firstTag.color,
      borderRadius: '2px',
      rangeBehavior: vscode.DecorationRangeBehavior.OpenOpen,
      isWholeLine: false,
    })

    ranges.value = tags.map((tag) => rpc.client.protocol2CodeConverter.asRange(tag.range))
  })

  useEditorDecorations(activeTextEditor, decoration, ranges)
  // useEditorDecorations(activeTextEditor, decoration, async editor => {
  //   // if (editor.document.languageId !== languageId) {
  //   //   return []
  //   // }
  //   const tags = await rpc.getDocumentTags({ documentUri: editor.document.uri.toString() })
  //   return tags.map((tag): vscode.DecorationOptions => {
  //     const range = rpc.client.protocol2CodeConverter.asRange(tag.range)
  //     if (tag.isSpecification) {
  //       return {
  //         range,
  //         renderOptions: {
  //           dark: {
  //             before: {
  //               contentText: '#',
  //               fontWeight: '400',
  //             },
  //           },
  //           light: {
  //             before: {
  //               contentText: '#',
  //               fontWeight: '400',
  //             },
  //           },
  //         },
  //       }
  //     }
  //     return {
  //       range,
  //       renderOptions: {
  //         before: {
  //           contentText: tag.name,
  //           color: tag.color,
  //         },
  //       },
  //       // renderOptions: {
  //       //   before: {
  //       //     contentText: '',
  //       //     color: '#A00',
  //       //     fontWeight: 'bold',
  //       //     margin: '0 2px',
  //       //   },
  //       // },
  //     }
  //   })
  // })
}
