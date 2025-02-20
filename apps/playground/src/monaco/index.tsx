/**
 * Temporary disabled lazy loading for better DX
 */
export { default as MonacoEditor } from './MonacoEditor'
// const LazyMonacoEditor = lazy(async () => {
//   // await initLocaleLoader()
//   return await import('./MonacoEditor')
// })

// export function MonacoEditor() {
//   return (
//     <Suspense fallback={<Loader size={'sm'} />}>
//       <LazyMonacoEditor />
//     </Suspense>
//   )
// }
