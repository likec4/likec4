# Uncle Bob Craft — Review do PR LeanIX Bridge + DrawIO

Critérios: Clean Code, Clean Architecture, SKILL uncle-bob-craft. Foco nas implementações deste PR (leanix-bridge, drawio export, handler).

---

## Resumo executivo

- **Pontos fortes:** Nomes intenção-reveladora, funções já extraídas (getLeanixRootStyleParts, buildDrawioExportOverrides, applyLeanixIdsToEntities), contratos bem definidos (model-input, contracts), Dependency Rule respeitada (bridge não depende de LikeC4 concreto).
- **Refactors aplicados:** Ver secção "Refactors implementados" abaixo.
- **Sugestões restantes:** Testes F.I.R.S.T. e fronteiras (T5); considerar extrações adicionais se as funções voltarem a crescer.

---

## Smells e heurísticas identificados

### Crítico

| Onde | Smell | Critério | Ação |
|------|--------|----------|------|
| `leanix-api-client.ts` | **G31 Hidden Temporal Coupling** / estado partilhado | `lastRequestTime` é variável de módulo; múltiplas instâncias de `LeanixApiClient` partilham o mesmo throttle. | Tornar `lastRequestTime` propriedade de instância (`private lastRequestTime = 0`). |
| `report.ts` | **G26 Be Precise** | Guard de coerência atira com mensagem genérica; o chamador não sabe qual campo difere. | Incluir na mensagem quais campos falharam (ex.: `projectId !== leanixDryRun.projectId`). |

### Sugestão (SRP / Stepdown / uma coisa)

| Onde | Smell | Critério | Ação |
|------|--------|----------|------|
| `sync-to-leanix.ts` | **F30/G30** Função faz várias coisas | `syncToLeanix` orquestra fact sheets, aplica IDs a entidades, e relações num único bloco longo. | Extrair `syncFactSheetsToLeanix(...)` (retorna map + counts + errors) e `syncRelationsToLeanix(...)` (retorna updatedRelations + counts + errors); `syncToLeanix` fica orquestração em alto nível. |
| `to-bridge-manifest.ts` | **G34** Um nível de abstração | Três loops semelhantes (entities, views, relations) ao mesmo nível que a construção do objeto final. | Extrair `buildManifestEntities(model)`, `buildManifestViews(model)`, `buildManifestRelations(model)` para stepdown e nomes que dizem o que fazem. |
| `to-leanix-inventory-dry-run.ts` | **G30** Uma coisa | Construção de fact sheets e de relations na mesma função. | Extrair `buildFactSheetsFromModel(model, mapping)` e `buildRelationsFromModel(model, mapping)`; a função principal só junta opções + chama as duas + devolve o objeto. |

### Nice-to-have (todos implementados)

| Onde | Critério | Implementação |
|------|----------|----------------|
| `drawio-leanix-roundtrip.ts` | **N1/N2, G34** | Extraídas `collectLikec4IdToLeanixFactSheetId` e `collectRelationKeyToLeanixRelationId`; `manifestToDrawioLeanixMapping` faz stepdown em duas linhas; JSDoc nas helpers. |
| `handler.ts` | — | Já bem decomposto; sem alteração. |
| `parse-drawio.ts` | **G5** | Sem duplicação; sem alteração. |
| `generate-drawio.ts` | **T5** | Teste de fronteira: profile leanix sem projectId (bridgeManaged + likec4ViewId, sem likec4ProjectId). |
| Testes | **T5/T6, T9** | Fronteiras: to-bridge-manifest (um elemento, uma relação); to-leanix-inventory-dry-run (vazio, um elemento, uma relação); drawio-leanix-roundtrip.spec (manifest vazio, sem externals, um entity/relation com external); report (mensagem de mismatch precisa). Testes rápidos, sem I/O. |

---

## Dependency Rule e camadas

- **Bridge** depende de `model-input` (interfaces) e de contratos; não depende de core LikeC4 nem de UI. **OK.**
- **Generators (drawio)** recebem View/ViewModel e opções; não conhecem LeanIX. Profile `leanix` é apenas opção de export. **OK.**

---

## Refactors implementados (nesta passagem)

1. **sync-to-leanix.ts:** Extraídas `syncFactSheetsToLeanix` e `syncRelationsToLeanix`; `syncToLeanix` orquestra em três passos: fact sheets → apply entities → relations.
2. **to-bridge-manifest.ts:** Extraídas `buildManifestEntities`, `buildManifestViews`, `buildManifestRelations`; `toBridgeManifest` junta opções e chama as três; JSDoc nas três.
3. **to-leanix-inventory-dry-run.ts:** Extraídas `buildFactSheetsFromModel` e `buildRelationsFromModel`; função principal só merge de mapping, geração de datas e chamada às duas; JSDoc nas duas.
4. **report.ts:** `buildCoherenceErrorMessage` com mensagem precisa (lista campos em falha); JSDoc.
5. **leanix-api-client.ts:** `lastRequestTime` passou a ser propriedade de instância para evitar acoplamento temporal entre clientes.
6. **drawio-leanix-roundtrip.ts (nice-to-have):** Extraídas `collectLikec4IdToLeanixFactSheetId` e `collectRelationKeyToLeanixRelationId`; `manifestToDrawioLeanixMapping` em stepdown; JSDoc nas helpers.
7. **Testes T5/T6 (fronteiras):** to-bridge-manifest.spec (um elemento, uma relação); to-leanix-inventory-dry-run.spec (vazio, um elemento, uma relação); drawio-leanix-roundtrip.spec (novo ficheiro: vazio, sem externals, um entity/relation com external); bridge-artifacts.spec (toReport throw com mensagem precisa); generate-drawio.spec (leanix sem projectId).

---

## Checklist pós-refactor

- [x] `pnpm test` (e tipo check) passam.
- [x] Nenhuma alteração de comportamento externo (APIs e contratos mantidos).
- [x] Comentários/JSDoc actualizados onde a responsabilidade da função mudou.
