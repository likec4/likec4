import type { LikeC4Services } from '../module'
import { DefaultRenameProvider } from 'langium/lsp'

export class LikeC4RenameProvider extends DefaultRenameProvider {
  constructor(services: LikeC4Services) {
    super(services)
  }
}
