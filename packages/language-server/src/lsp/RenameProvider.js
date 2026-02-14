import { DefaultRenameProvider } from 'langium/lsp';
export class LikeC4RenameProvider extends DefaultRenameProvider {
    constructor(services) {
        super(services);
    }
}
