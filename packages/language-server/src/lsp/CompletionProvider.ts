import { type CompletionProviderOptions, DefaultCompletionProvider } from 'langium/lsp'

export class LikeC4CompletionProvider extends DefaultCompletionProvider {
  override readonly completionOptions = {
    triggerCharacters: ['.']
  } satisfies CompletionProviderOptions
}
