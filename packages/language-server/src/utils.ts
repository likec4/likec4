import type { LangiumDocument } from 'langium'
import { Utils } from 'vscode-uri'

export const printDocs = (docs: LangiumDocument[]) => docs.map(d => '  - ' + Utils.basename(d.uri)).join('\n')
