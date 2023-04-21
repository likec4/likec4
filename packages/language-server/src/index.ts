// import { type DefaultSharedModuleContext, startLanguageServer as startLangiumLanguageServer } from 'langium'
export { createLanguageServices } from './module'

export type { LikeC4Services } from './module'
// export type { C4XModel } from './c4x-model'
// export type { C4XLangiumDocument } from './ast'

// export {
//   LanguageId
// } from './const'

export { LikeC4LanguageMetaData as LanguageMetaData } from './generated/module'

// export { createC4XServices }

// export function startLanguageServices(context: DefaultSharedModuleContext) {
//   const { shared, likec4 } = createLikeC4Services(context)
//   startLangiumLanguageServer(shared)
//   return likec4
// }
