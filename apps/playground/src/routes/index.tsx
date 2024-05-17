import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => {
    return <Navigate to="/w/$id/" params={{ id: 'tutorial' }} />
  }
})

// export function IndexPage() {
//   const ref = useRef<MonacoEditorReactComp>(null)
//   const [count,counter] = useCounter()
//   const userConfig = useMemo(() =>
//     createMonacoConfig({
//       text: `
// // LikeC4 code
// specification {
//   element actor {
//     style {
//       shape person
//     }
//   }
//   element system
// }

// model {
//   actor customer 'Customer'
//   sys = system 'System'
// }

// views {
//   view index {
//     include *
//   }
// }
// `.trimStart()
//     }), [createMonacoConfig])

//   useDebouncedEffect(() => {
//     const wrapper = ref.current?.getEditorWrapper()
//     console.debug(`wrapper.isStarted: ${wrapper?.isStarted() ?? '--'}`)
//     if (!wrapper?.isStarted()) {
//       counter.inc()
//       return
//     }
//     const sub = wrapper.getLanguageClient()?.onNotification(onDidChangeModel, () => {
//       console.info('onDidChangeModel')
//     })

//     return () => {
//       console.debug('unsubscribe onDidChangeModel')
//       sub?.dispose()
//     }
//   }, [count, userConfig, counter], 200)

//   // //       // worker
//   // //     })
//   // //   })

//   //   useEffect(() => {
//   //     setUserConfig(createMonacoConfig({
//   //       text: `
//   // // LikeC4 code
//   // specification {
//   //   element system
//   // }

//   // model {
//   //   sys = system
//   // }
//   // `.trimStart(),
//   //     }))
//   //     return () => {
//   //       setUserConfig(null)
//   //     }
//   //   }, [])

//   return (
//     <Box pos={'fixed'} inset={0}>
//       <MonacoEditorReactComp
//         ref={ref}
//         userConfig={userConfig}
//         style={{
//           width: '100%',
//           'height': '100%'
//         }}
//       />
//     </Box>
//   )
// }
