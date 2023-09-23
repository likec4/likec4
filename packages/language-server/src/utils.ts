import type { LangiumDocument } from 'langium'

export const printDocs = (docs: LangiumDocument[]) => docs.map(d => '  - ' + d.uri.path).join('\n')
