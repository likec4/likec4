import { DocumentState, TextDocument, UriUtils } from 'langium';
import * as assert from 'node:assert';
import { entries, once } from 'remeda';
import stripIndent from 'strip-indent';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { URI, Utils } from 'vscode-uri';
import { createLanguageServices } from '../module';
export function createTestServices(options) {
    const workspace = options?.workspace ?? 'file:///test/workspace';
    const projectConfig = options?.projectConfig;
    const services = createLanguageServices({}).likec4;
    const metaData = services.LanguageMetaData;
    const langiumDocuments = services.shared.workspace.LangiumDocuments;
    const documentBuilder = services.shared.workspace.DocumentBuilder;
    const modelBuilder = services.likec4.ModelBuilder;
    const workspaceUri = URI.parse(workspace);
    const formatter = services.lsp.Formatter;
    const workspaceFolder = {
        name: projectConfig?.name || 'test-project',
        uri: workspaceUri.toString(),
    };
    let documentIndex = 1;
    const initialize = once(async () => {
        services.shared.workspace.ConfigurationProvider.updateConfiguration({
            settings: { likec4: { formatting: { quoteStyle: 'single' } } },
        });
        services.shared.workspace.WorkspaceManager.initialize({
            capabilities: {},
            processId: null,
            rootUri: workspaceFolder.uri,
            workspaceFolders: [workspaceFolder],
        });
        await services.shared.workspace.WorkspaceManager.initializeWorkspace([workspaceFolder]);
        // Register project with config if provided...
        if (projectConfig) {
            const projectFolderUri = Utils.resolvePath(workspaceUri, 'src');
            await services.shared.workspace.ProjectsManager.registerProject({
                config: {
                    name: projectConfig?.name || 'test-project',
                    title: projectConfig?.title || 'Test Project',
                    contactPerson: projectConfig?.contactPerson || 'Unknown',
                    imageAliases: projectConfig?.imageAliases || {},
                    exclude: projectConfig?.exclude || ['node_modules'],
                },
                folderUri: projectFolderUri,
            });
        }
    });
    const addDocument = async (input, uri) => {
        await initialize();
        const docUri = Utils.resolvePath(workspaceUri, './src/', uri ?? `${documentIndex++}${metaData.fileExtensions[0]}`);
        const document = services.shared.workspace.LangiumDocumentFactory.fromString(stripIndent(input), docUri);
        langiumDocuments.addDocument(document);
        return document;
    };
    const removeDocument = async (doc) => {
        const uri = doc instanceof URI ? doc : doc.uri;
        await documentBuilder.update([], [uri]);
    };
    const parse = async (input, uri) => {
        const document = await addDocument(input, uri);
        await documentBuilder.build([document], { validation: false });
        return document;
    };
    const validate = async (input, uri) => {
        const document = typeof input === 'string' ? await addDocument(input, uri) : input;
        await documentBuilder.build([document], { validation: true });
        const diagnostics = document.diagnostics ?? [];
        const warnings = diagnostics.flatMap(d => d.severity === DiagnosticSeverity.Warning ? d.message : []);
        const errors = diagnostics.flatMap(d => d.severity === DiagnosticSeverity.Error ? d.message : []);
        return {
            document,
            diagnostics,
            warnings,
            errors,
        };
    };
    const format = async (input, uri) => {
        const document = typeof input === 'string' ? await parse(stripIndent(input), uri) : input;
        await documentBuilder.build([document], { validation: true });
        const edits = await formatter?.formatDocument(document, {
            options: { tabSize: 2, insertSpaces: true },
            textDocument: { uri: document.uri.toString() },
        });
        return TextDocument.applyEdits(document.textDocument, edits ?? []);
    };
    const validateAll = async () => {
        const docs = langiumDocuments.all.toArray();
        assert.ok(docs.length > 0, 'no documents to validate');
        await documentBuilder.build(docs, { validation: true });
        const diagnostics = docs.flatMap(doc => doc.diagnostics ?? []);
        const warnings = diagnostics.flatMap(d => d.severity === DiagnosticSeverity.Warning ? d.message : []);
        const errors = diagnostics.flatMap(d => d.severity === DiagnosticSeverity.Error ? d.message : []);
        return {
            diagnostics,
            errors,
            warnings,
        };
    };
    const buildModel = async () => {
        if (langiumDocuments.all.some(doc => doc.state < DocumentState.Validated)) {
            await validateAll();
        }
        const likec4model = await modelBuilder.computeModel();
        if (!likec4model)
            throw new Error('No model found');
        return likec4model.$data;
    };
    const buildLikeC4Model = async () => {
        if (langiumDocuments.all.some(doc => doc.state < DocumentState.Validated)) {
            await validateAll();
        }
        const likec4model = await modelBuilder.computeModel();
        if (!likec4model)
            throw new Error('No model found');
        return likec4model;
    };
    /**
     * This will clear all documents
     */
    const resetState = async () => {
        const docs = langiumDocuments.resetProjectIds();
        await documentBuilder.update([], docs);
    };
    return {
        services,
        addDocument,
        removeDocument,
        parse,
        validate,
        validateAll,
        buildModel,
        buildLikeC4Model,
        resetState,
        format,
    };
}
/**
 * @example
 * ```ts
 * const { projects } = await createMultiProjectTestServices({
 *   project1: {
 *     doc1: `...`,
 *     doc2: `...`,
 *   },
 *   project2: {
 *     doc1: `...`,
 *   },
 * })
 * ```
 */
export async function createMultiProjectTestServices(data) {
    const workspace = 'file:///test/workspace';
    const { services, addDocument, validateAll, resetState, } = createTestServices({ workspace });
    const projects = {};
    for (const [name, files] of entries(data)) {
        const folderUri = UriUtils.joinPath(URI.parse(workspace), 'src', name);
        await services.shared.workspace.ProjectsManager.registerProject({
            config: {
                name,
                exclude: ['node_modules'],
            },
            folderUri,
        });
        // @ts-ignore
        projects[name] = {};
        for (let [docName, content] of entries(files)) {
            const fileName = docName.endsWith('.c4') ? docName : `${docName}.c4`;
            // @ts-ignore
            projects[name][docName] = await addDocument(content, `${name}/${fileName}`);
        }
    }
    async function buildLikeC4Model(projectId) {
        if (services.shared.workspace.LangiumDocuments.all.some(doc => doc.state < DocumentState.Validated)) {
            await validateAll();
        }
        const likec4model = await services.likec4.ModelBuilder.computeModel(projectId);
        if (!likec4model)
            throw new Error('No model found');
        return likec4model;
    }
    async function buildModel(projectId) {
        const model = await buildLikeC4Model(projectId);
        return model.$data;
    }
    return {
        services,
        projects,
        projectsManager: services.shared.workspace.ProjectsManager,
        addDocument: async (uri, input) => {
            return await addDocument(input, uri.toString());
        },
        /**
         * Add document outside of projects
         */
        addDocumentOutside: async (input) => {
            return await addDocument(input);
        },
        validateAll,
        buildModel,
        buildLikeC4Model,
        resetState,
    };
}
