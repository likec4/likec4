import { DefaultRenameProvider } from 'langium/lsp'
import type { LikeC4Services } from '../module'

export class LikeC4RenameProvider extends DefaultRenameProvider {
  constructor(services: LikeC4Services) {
    super(services)
  }
}
