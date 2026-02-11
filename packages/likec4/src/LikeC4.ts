import { LikeC4 as AbstractLikeC4 } from '@likec4/language-services/node'
import { defu } from 'defu'
import { URI, UriUtils } from 'langium'
import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createLanguageServices } from './language/module'
import type { Logger } from './logger'

type LikeC4Langium = ReturnType<typeof createLanguageServices>

export type LikeC4Options = {
  /**
   * By default, if LikeC4 model is invalid, errors are printed to the console.
   * Disable this behavior by setting this option to false.
   *
   * @default true
   */
  printErrors?: boolean
  /**
   * If true, initialization will return rejected promise with the LikeC4 instance.
   * Use `likec4.getErrors()` to get the errors.
   * @default false
   */
  throwIfInvalid?: boolean
  /**
   * Logger to use for the language service.
   * false - no output
   * @default 'default'
   */
  logger?: Logger | 'vite' | 'default' | false
  /**
   * Whether to use the `dot` binary for layouting or the WebAssembly version.
   * @default 'wasm'
   */
  graphviz?: 'wasm' | 'binary'

  /**
   * Whether to start MCP server
   * @default false
   */
  mcp?: false | 'stdio' | { port: number }

  /**
   * Whether to watch for changes in the workspace.
   * @default false
   */
  watch?: boolean
}

const validationErrorsToError = (likec4: LikeC4) =>
  new Error(
    `Invalid model:\n${
      likec4.getErrors().map(e => `  ${e.sourceFsPath}:${e.line} ${e.message.slice(0, 200)}`).join('\n')
    }`,
  )

export class LikeC4 extends AbstractLikeC4 {
  static async fromSource(likec4SourceCode: string, opts?: LikeC4Options): Promise<LikeC4> {
    const langium = createLanguageServices(
      defu(opts, {
        useFileSystem: false,
        watch: false,
        logger: false as const,
        graphviz: 'wasm' as const,
        mcp: false as const,
      }),
    )

    const workspaceUri = URI.from({
      scheme: 'virtual',
      path: '/workspace',
    })

    const uri = UriUtils.joinPath(workspaceUri, 'source.likec4')
    const doc = langium.shared.workspace.LangiumDocuments.createDocument(uri, likec4SourceCode)

    await langium.cli.Workspace.initWorkspace({
      uri: workspaceUri.toString(),
      name: 'virtual',
    })

    await langium.shared.workspace.DocumentBuilder.build([doc], {
      validation: true,
    })

    const likec4 = new LikeC4(workspaceUri.path, langium)

    if (opts?.throwIfInvalid === true && likec4.hasErrors()) {
      await likec4.dispose()
      return Promise.reject(validationErrorsToError(likec4))
    }

    if (opts?.printErrors !== false && likec4.hasErrors()) {
      likec4.printErrors()
    }

    return likec4
  }

  /**
   * Prevents multiple instances of LikeC4 for the same workspace
   */
  private static likec4Instances = new Map<string, LikeC4>()

  /**
   * Initializes a LikeC4 instance from the specified workspace path.
   * By default in current folder
   */
  static async fromWorkspace(path = '.', opts?: LikeC4Options): Promise<LikeC4> {
    const workspace = resolve(path)
    if (!existsSync(workspace)) {
      throw new Error(`Workspace not found: ${workspace}`)
    }
    let likec4 = LikeC4.likec4Instances.get(workspace)
    if (!likec4) {
      const langium = createLanguageServices(
        defu(opts, {
          useFileSystem: true,
          watch: false,
          logger: 'default' as const,
          graphviz: 'wasm' as const,
          mcp: false as const,
        }),
      )

      likec4 = new LikeC4(workspace, langium)
      LikeC4.likec4Instances.set(workspace, likec4)

      await langium.cli.Workspace.initWorkspace({
        uri: pathToFileURL(workspace).toString(),
        name: basename(workspace),
      })

      if (opts?.printErrors !== false && likec4.hasErrors()) {
        likec4.printErrors()
      }
    }

    if (opts?.throwIfInvalid === true && likec4.hasErrors()) {
      await likec4.dispose()
      return Promise.reject(validationErrorsToError(likec4))
    }

    return likec4
  }
}
