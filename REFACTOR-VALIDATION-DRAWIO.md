# Validação de refactor: Draw.io export (DRY, SOLID, KISS, YAGNI, Clean Code)

Relatório de análise do código da feature Draw.io export para identificar pendências críticas antes de subir um PR mais limpo.

---

## Resumo executivo

| Severidade | Quantidade | Ação sugerida |
|------------|------------|---------------|
| **Crítica** | 0 | — |
| **Alta** | 4 | Refactor antes do PR |
| **Média** | 6 | Refactor se houver tempo; senão, deixar para PR seguinte |
| **Baixa** | 5 | Opcional / tech debt |

**Conclusão:** Não há pendências **críticas** que impeçam o PR. Há oportunidades claras de DRY e KISS que melhoram a revisão e manutenção. Os ficheiros grandes (`generate-drawio.ts` ~1120 linhas, `parse-drawio.ts` ~1675 linhas) já estão razoavelmente decompostos em funções com responsabilidade única; o principal ganho está em extrair helpers pequenos e eliminar duplicação local.

---

## 1. DRY (Don't Repeat Yourself)

### 1.1 [Alta] `navLinkStyle` repetido 3 vezes em `generate-drawio.ts`

**Onde:** Linhas 572, 630 e lógica equivalente em 593–596, 644–645.

**Problema:** A construção `navTo === '' ? '' : \`link=${encodeURIComponent(\`${DRAWIO_PAGE_LINK_PREFIX}${navTo}\`)}\`;` aparece em `buildNodeCellXml` e em `buildContainerTitleCellXml`.

**Recomendação:** Extrair helper e usar em todos os sítios.

```ts
/** Build Draw.io link= style for navigateTo (empty string when no nav). */
function buildNavLinkStyle(navTo: string): string {
  return navTo === '' ? '' : `link=${encodeURIComponent(`${DRAWIO_PAGE_LINK_PREFIX}${navTo}`)};`
}
```

Depois substituir as 3 ocorrências por `buildNavLinkStyle(navTo)`.

---

### 1.2 [Alta] Serialização de `links` (url/title) repetida para nodes e edges

**Onde:** `generate-drawio.ts` linhas ~400 (edgeLinks), ~407 (edgeMetadata), ~545 (node links).

**Problema:**  
`encodeURIComponent(JSON.stringify(links.map(l => ({ url: l.url, title: l.title }))))` usado para edges e nodes. Padrão semelhante para metadata em edges.

**Recomendação:** Um helper para links e outro para “JSON encode for style” (ou genérico), para evitar repetição e erros.

```ts
function linksToStyleJson(links: readonly { url: string; title?: string }[]): string {
  if (!Array.isArray(links) || links.length === 0) return ''
  return encodeURIComponent(JSON.stringify(links.map(l => ({ url: l.url, title: l.title }))))
}
```

Usar em buildEdgeCellXml (edgeLinks, edgeMetadata) e em buildNodeCellXml (links).

---

### 1.3 [Média] Padrão “flatten + trim + isEmptyish” repetido

**Onde:** `generate-drawio.ts` — em `buildEdgeCellXml` (edgeDesc, edgeTech, edgeNotes) e em `buildNodeCellXml` (desc, tech, notes, summaryStr).

**Problema:** Várias linhas do tipo:
`const x = raw != null && !isEmptyish(raw) ? raw.trim() : ''`

**Recomendação:** Helper único para “string útil para export”:

```ts
function toExportString(raw: MarkdownOrString | undefined | null): string {
  const flat = raw != null ? flattenMarkdownOrString(raw) : null
  return flat != null && !isEmptyish(flat) ? flat.trim() : ''
}
```

Substituir todas as variantes por `toExportString(...)` (DRY + menos ruído).

---

### 1.4 [Média] `buildNodeCellXml`: dois ramos para `cellXml` (com/sem UserObject)

**Onde:** `generate-drawio.ts` ~584–596.

**Problema:** O bloco que monta `vertexTextStyle`, `shapeStyle`, `colorStyle`, etc., e a geometria está duplicado entre:
- ramo `navTo === ''` (só mxCell) e  
- ramo `navTo !== ''` (UserObject + mxCell interior).

**Recomendação:** Calcular uma única string `innerCellXml` (ou “base cell”) com estilo + geometria + userObjectXml; depois, em função de `navTo`, decidir se se embrulha em `<UserObject ...>` ou se se usa como mxCell com id. Assim evita-se duplicar a construção do estilo e da geometria.

---

### 1.5 [Baixa] `stripHtml` vs `stripHtmlForTitle` em `parse-drawio.ts`

**Onde:** Linhas 654–661.

**Problema:** Ambas delegam em `stripHtmlFromValue`; são idênticas (YAGNI).

**Recomendação:** Manter uma só (por exemplo `stripHtml`) e usar em todo o lado; remover `stripHtmlForTitle` ou deixar como alias documentado se quiserem nomes diferentes no código por legibilidade.

---

## 2. SOLID

### 2.1 [Média] Ficheiros muito grandes

**Onde:**  
- `packages/generators/src/drawio/generate-drawio.ts` ~1119 linhas  
- `packages/generators/src/drawio/parse-drawio.ts` ~1675 linhas  

**Análise:** Dentro dos ficheiros já existe boa decomposição (layout, buildNodeCellXml, buildEdgeCellXml, computeDiagramLayout, etc.). A violação é mais de “módulo/ficheiro” do que de “classe”. Single Responsibility está razoavelmente respeitado por função.

**Recomendação (opcional):**  
- Em `generate-drawio`: extrair para um ficheiro `generate-drawio-helpers.ts` (ou `xml-builders.ts`) as funções puras de construção de XML e de estilo (escapeXml, escapeHtml, buildNavLinkStyle, buildLikec4StyleForNode/Edge, buildNodeValueHtml, etc.), deixando em `generate-drawio.ts` orquestração, layout e API pública.  
- Em `parse-drawio`: considerar extrair “parse phase” (XML → DrawioCell[]) para um módulo e “emit phase” (DrawioCell → .c4 source) para outro, se quiserem reduzir tamanho e responsabilidade do ficheiro.  

Não é bloqueante para o PR; pode ser tech debt para um PR de “drawio cleanup”.

---

### 2.2 [Baixa] Objeto de parâmetros muito grande em `buildLikec4StyleForNode`

**Onde:** `generate-drawio.ts` ~276–313.

**Problema:** Objeto com muitos campos (desc, tech, notes, tagList, navTo, iconName, …). Dificulta leitura e testes.

**Recomendação:** Manter por agora; se no futuro surgirem mais campos, considerar agrupar em subobjetos (e.g. `nodeStyle`, `roundtrip`) ou um “builder” interno. Não prioritário para este PR.

---

## 3. KISS (Keep It Simple, Stupid)

### 3.1 [Alta] Construção de `cellXml` em `buildNodeCellXml`

**Onde:** `generate-drawio.ts` 584–596.

**Problema:** Dois ramos longos com strings de XML muito parecidas; a diferença é só “mxCell com id” vs “UserObject + mxCell interior”. Isso torna o fluxo difícil de seguir.

**Recomendação:** Unificar numa única construção de “conteúdo da célula” e depois um `if (navTo === '') return mxCellStandalone; else return wrapInUserObject(...)` (ou equivalente). Reduz complexidade e duplicação (alinha com DRY 1.4).

---

### 3.2 [Média] `collectViewModelsForExportAll` com vários fallbacks

**Onde:** `useDrawioContextMenuActions.ts` ~55–109.

**Problema:** Vários passos (getLayoutedModel, viewStates, layoutViews, likec4model.view) em sequência. Lógica correta mas um pouco densa.

**Recomendação:** Manter; opcionalmente extrair funções com nomes descritivos, e.g. `mergeFromLayoutedModel`, `fillFromViewStates`, `fillFromLayoutViews`, `fillFromModelView`, e chamá-las em ordem. Melhora legibilidade sem mudar comportamento.

---

## 4. YAGNI (You Aren’t Gonna Need It)

### 4.1 [Média] `stripHtml` vs `stripHtmlForTitle`

**Onde:** `parse-drawio.ts` 654–661.

**Problema:** Duas funções que fazem o mesmo (YAGNI).

**Recomendação:** Colapsar numa só (ver DRY 1.5).

---

### 4.2 [Baixa] Constantes locais em `generate-drawio.ts`

**Onde:** `LIKEC4_FONT_FAMILY`, `CONTAINER_TITLE_COLOR` (e possivelmente `DEFAULT_BBOX`) estão no ficheiro em vez de em `constants.ts`.

**Recomendação:** Se `constants.ts` já é o “single source of truth” para drawio (como indicado no comentário), mover essas constantes para `constants.ts` evita “magic values” e centraliza configuração. Baixa prioridade.

---

## 5. Clean Code

### 5.1 [Média] Nomes e comentários

**Onde:** Vários sítios.

**Pontos positivos:**  
- Comentários JSDoc em funções principais.  
- Nomes como `buildNodeCellXml`, `buildEdgeCellXml`, `computeDiagramLayout`, `getEffectiveStyles` são claros.  
- `constants.ts` documentado como single source of truth.

**Sugestões:**  
- Onde houver “Raw”/“Flat”/“Enc” (e.g. edgeDescRaw, edgeDesc), manter o padrão de forma consistente para quem lê.  
- Em funções com muitos parâmetros (ex.: buildLikec4StyleForNode), um comentário de uma linha no topo a listar os “grupos” (node metadata, style overrides, roundtrip) ajuda.

---

### 5.2 [Baixa] Comprimento de funções

**Onde:** `buildNodeCellXml` e `buildEdgeCellXml` são longas (~130 e ~115 linhas).

**Análise:** Já extraem estilo (buildLikec4StyleForNode/Edge), userObject, etc. O que sobra é principalmente agregação de dados e uma string final. Aceitável para um PR focado em “limpeza sem reestruturação grande”.

**Recomendação:** Se fizerem o refactor DRY 1.4 (um único fluxo para cellXml), a `buildNodeCellXml` tende a ficar mais curta. Não obrigatório para este PR.

---

## 6. Checklist de refactor sugerido antes do PR

Fazer antes de abrir o PR (impacto alto, esforço baixo):

- [x] **DRY 1.1** — Introduzir `buildNavLinkStyle(navTo)` e usar nas 3 ocorrências em `generate-drawio.ts`.
- [x] **DRY 1.2** — Introduzir `linksToStyleJson(links)` e `metadataToStyleJson(metadata)` e usar em edges e nodes.
- [x] **DRY 1.3** — Introduzir `toExportString(raw)` e substituir os padrões flatten+trim+isEmptyish em buildEdgeCellXml e buildNodeCellXml.
- [x] **KISS/DRY 1.4** — Unificar os dois ramos de construção de `cellXml` em `buildNodeCellXml` (uma base + wrap opcional em UserObject).

Opcional (se der tempo):

- [x] **DRY 1.5 / YAGNI 4.1** — Unificar `stripHtml` e `stripHtmlForTitle` em `parse-drawio.ts`.
- [x] **YAGNI 4.2** — Mover `LIKEC4_FONT_FAMILY` e `CONTAINER_TITLE_COLOR` para `constants.ts`.

Não obrigatório para este PR:

- Divisão de `generate-drawio.ts` / `parse-drawio.ts` em mais ficheiros (SOLID 2.1).  
- Refactor de `buildLikec4StyleForNode` em subobjetos (SOLID 2.2).  
- Extração de passos em `collectViewModelsForExportAll` (KISS 3.2).

---

## 7. CLI e Playground

- **CLI** (`packages/likec4/src/cli/export/drawio/handler.ts`): Já está enxuto, com funções pequenas e responsabilidades claras (`getSourceContentIfRoundtrip`, `buildOptionsByViewId`, `exportDrawioAllInOne`, `exportDrawioPerView`, `runExportDrawio`). Nenhuma pendência crítica ou alta.
- **Playground** (`DrawioContextMenuProvider`, `useDrawioContextMenuActions`): Estrutura clara; `downloadDrawioBlob` e `toViewModel` já são helpers reutilizáveis. Única melhoria sugerida é opcional (KISS 3.2 em `collectViewModelsForExportAll`).

---

*Documento gerado para apoiar um PR mais limpo da feature Draw.io export (branch `feat/drawio-export`).*
