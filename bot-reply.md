**Respostas aos comentários dos bots**

@coderabbitai Obrigado pelo review. Alterações feitas:

- **e2e likec4-cli-export-drawio.spec.ts:** A asserção exige agora os dois marcadores: `expect(content).toMatch('bridgeManaged=true')` e `expect(content).toMatch('likec4Id=')`.
- **packages/generators/src/drawio/generate-drawio.ts:** Tokens do profile leanix no root passam a ser separados por `;` (cada token termina com `;`); lógica extraída para `getLeanixRootStyleParts(view, options)`.
- **packages/leanix-bridge/src/contracts.ts:** `BRIDGE_VERSION` é lido de `../package.json` via `createRequire(import.meta.url)` (fallback `'0.1.0'`).
- **packages/leanix-bridge/src/mapping.ts:** `mergeWithDefault` devolve sempre objetos aninhados novos (`factSheetTypes`, `relationTypes`, `metadataToFields` com spread); comentário alinhado com actor → Provider.
- **packages/leanix-bridge/src/to-bridge-manifest.ts:** `generatedAt` removido dos defaults de módulo; calculado por chamada com `options.generatedAt ?? new Date().toISOString()`.
- **packages/leanix-bridge/src/to-leanix-inventory-dry-run.ts:** Campo `technology` usa type guard `typeof meta.technology === 'string'` em vez de cast.
- **packages/likec4/src/cli/export/drawio/handler.ts:** `overrides` define sempre `compressed` (true por defeito, false com `--uncompressed`); extraída `buildDrawioExportOverrides(uncompressed, profile, projectId)`.
- **packages/generators/src/drawio/parse-drawio.ts:** Em `assignFqnsToElementVertices`, `usedNames` é preenchido com os segmentos dos `likec4Id` de bridge para que nomes gerados não colidam.
- **packages/generators/src/drawio/parse-drawio.spec.ts:** Nome do teste atualizado para refletir "bridge-managed likec4Id yields stable FQN identity".
- **packages/leanix-bridge:** lint → `oxlint --type-aware`; **report.ts** guard de coerência (projectId, mappingProfile); **fixture-model.ts** defaults com `metadata: {}`; **bridge-artifacts.spec.ts** e **to-bridge-manifest.spec.ts** com `mappingProfile: 'snapshot'` e `BRIDGE_VERSION`.

A descrição do PR foi atualizada com sync, round-trip, E2E, todos os fixes e refactors (getLeanixRootStyleParts, buildDrawioExportOverrides, applyLeanixIdsToEntities).

@chatgpt-codex-connector Obrigado pelo review; as alterações acima cobrem também os pontos que assinalaste (delimitadores rootParts, BRIDGE_VERSION, generatedAt, technology type guard, overrides compressed, usedNames em assignFqns, e refactors).
