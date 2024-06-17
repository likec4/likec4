import { type CompletionProviderOptions, DefaultCompletionProvider } from 'langium/lsp'

export class LikeC4CompletionProvider extends DefaultCompletionProvider {
  readonly completionOptions = {
    triggerCharacters: ['.']
  } satisfies CompletionProviderOptions
}
