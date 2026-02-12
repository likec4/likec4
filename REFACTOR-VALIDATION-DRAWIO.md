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

## 8. Varredura minuciosa (fase 2) — oportunidades adicionais

Após o commit do refactor anterior, nova varredura para identificar mais oportunidades de SOLID, DRY, YAGNI, KISS e Clean Code. Itens por prioridade (M = média, B = baixa).

### 8.1 DRY

**8.1.1 [M] Padrão try/catch de tema em `generate-drawio.ts`**

- **Onde:** `getElementColors`, `getEdgeStrokeColor`, `getEdgeLabelColors` (linhas ~151–200).
- **Problema:** Os três usam o mesmo padrão: `getEffectiveStyles` → `resolveThemeColor` → `try { styles.colors(themeColor) ... } catch { LikeC4Styles.DEFAULT.colors(...) }`.
- **Recomendação:** Extrair um helper, por exemplo `getThemeValues<T>(viewmodel, color, fallback, getter: (values) => T): T`, que encapsula o try/catch e o fallback para `LikeC4Styles.DEFAULT`, e usar nos três. Reduz duplicação e facilita mudanças futuras no fallback.

**8.1.2 [M] Emissão de links (elementos vs edges) em `parse-drawio.ts`**

- **Onde:** `pushElementLinks` (linhas ~740–775) e o bloco `try { linksArr = JSON.parse(linksJson) ... }` dentro de `emitEdgesToLines` (linhas ~884–906).
- **Problema:** A lógica de parse de `linksJson` e o formato da linha `link 'url' 'title'` estão duplicados (elementos usam `ctx.lines.push` com `pad`; edges usam `bodyLines.push` com indentação fixa).
- **Recomendação:** Extrair uma função, por exemplo `formatLinkLines(linksJson, nativeLink, pad: string): string[]`, que devolve as linhas já formatadas (ou que recebe um callback `push(line)`). Reutilizar em `pushElementLinks` e em `emitEdgesToLines` para eliminar duplicação.

**8.1.3 [B] Coerção “string não vazia” repetida**

- **Onde:** `generate-drawio.ts`: `navTo`, `edgeNavTo`, `iconName` (padrão `x != null && x !== '' ? String(x) : ''`).
- **Recomendação:** Helper opcional, por exemplo `toNonEmptyString(x: unknown): string`, para centralizar e documentar a regra. Baixo impacto; melhora legibilidade.

### 8.2 SOLID

**8.2.1 [M] Responsabilidade única em “resolver cores com fallback”**

- **Onde:** `generate-drawio.ts`: as três funções de cor (element, edge stroke, edge label) misturam “obter estilo efectivo”, “resolver nome do tema” e “aplicar fallback em caso de erro”.
- **Recomendação:** Alinhado com 8.1.1: um único ponto que “dá valores de tema com fallback” (SRP) e as funções públicas apenas mapeiam esses valores para fill/stroke/font ou line/label. Facilita testes e evolução.

**8.2.2 [B] `buildCellFromMxCell` com muitos spreads condicionais**

- **Onde:** `parse-drawio.ts` ~223–325: construção de um objeto com dezenas de `...(x != null ? { x } : {})`.
- **Recomendação:** Manter por agora. Se no futuro for difícil de manter, considerar um “builder” interno ou funções pequenas que devolvem partials por grupo (geom, style, userData). Não prioritário.

### 8.3 KISS

**8.3.1 [M] Lógica de `containerDashed` e `strokeWidthDefault` em `buildNodeCellXml`**

- **Onde:** `generate-drawio.ts` ~541–547 (containerDashed: 3 ramos) e ~538 (strokeWidthDefault: expressão ternária aninhada).
- **Recomendação:** Extrair funções puras, por exemplo `getContainerDashedStyle(isContainer, borderVal): string` e `getDefaultStrokeWidth(borderVal, isContainer): string`. Reduz ruído e torna o fluxo de `buildNodeCellXml` mais legível.

**8.3.2 [B] IIFE para `elemColors` quando há `strokeColorOverride`**

- **Onde:** `generate-drawio.ts` ~516–525: `elemColors = strokeColorOverride ? ((): ElementColors => { ... })() : getElementColors(...)`.
- **Recomendação:** Extrair função nomeada, por exemplo `applyStrokeColorOverride(base: ElementColors | undefined, override: string): ElementColors`, e chamar em uma linha. Elimina IIFE e deixa a intenção explícita.

### 8.4 YAGNI

**8.4.1 [B] Constante `DRAWIO_FILE_EXT` no CLI**

- **Onde:** `packages/likec4/src/cli/export/drawio/handler.ts`: `const DRAWIO_FILE_EXT = '.drawio'`.
- **Análise:** Única utilização; poderia ser inline. Manter a constante continua a ser legível e consistente com “single source of truth” para a extensão no CLI. Sem ação obrigatória.

### 8.5 Clean Code

**8.5.1 [M] Nome e tamanho de `emitElementToLines`**

- **Onde:** `parse-drawio.ts` ~776–855: função longa com muitas variáveis locais e um `hasBody` com muitos `!!`.
- **Recomendação:** Extrair a computação de `hasBody` para uma função, por exemplo `elementHasBody(cell, childList, colorName, ...): boolean`, e opcionalmente agrupar a escrita do “body” (style, tags, desc, tech, etc.) numa função `pushElementBody(...)`. Melhora legibilidade sem alterar comportamento.

**8.5.2 [B] `decodeXmlEntities` (parse) vs `escapeXml` (generate)**

- **Onde:** `parse-drawio.ts` tem `decodeXmlEntities`; `generate-drawio.ts` tem `escapeXml`. São operações inversas; não há partilha de código.
- **Recomendação:** Opcional: criar `packages/generators/src/drawio/xml-utils.ts` com `escapeXml` e `decodeXmlEntities` e importar em ambos. Reduz risco de desalinhamento futuro (ex.: novos caracteres escapados). Baixa prioridade.

**8.5.3 [B] Magic number em `downloadDrawioBlob`**

- **Onde:** `useDrawioContextMenuActions.ts`: `setTimeout(..., 1000)` para revoke da object URL.
- **Recomendação:** Constante nomeada, por exemplo `DRAWIO_DOWNLOAD_REVOKE_MS = 1000`, ou comentário a explicar o atraso. Melhora intenção.

### 8.6 Resumo fase 2

| Id   | Princípio | Prioridade | Esforço | Descrição curta |
|------|-----------|------------|---------|-----------------|
| 8.1.1 | DRY       | M          | Médio   | Helper tema (try/catch + default) em generate-drawio |
| 8.1.2 | DRY       | M          | Médio   | formatLinkLines partilhado em parse-drawio (elementos + edges) |
| 8.1.3 | DRY       | B          | Baixo   | toNonEmptyString em generate-drawio |
| 8.2.1 | SOLID     | M          | Médio   | SRP para “resolver cores com fallback” (com 8.1.1) |
| 8.2.2 | SOLID     | B          | Alto    | Builder/partials em buildCellFromMxCell (opcional) |
| 8.3.1 | KISS      | M          | Baixo   | getContainerDashedStyle + getDefaultStrokeWidth |
| 8.3.2 | KISS      | B          | Baixo   | applyStrokeColorOverride em vez de IIFE |
| 8.4.1 | YAGNI     | B          | —       | Sem ação (constante CLI OK) |
| 8.5.1 | Clean Code| M          | Médio   | elementHasBody + pushElementBody em emitElementToLines |
| 8.5.2 | Clean Code| B          | Baixo   | xml-utils partilhado (opcional) |
| 8.5.3 | Clean Code| B          | Baixo   | Constante para revoke delay no download |

Sugestão: para um próximo PR de “drawio cleanup”, priorizar 8.1.1+8.2.1, 8.3.1 e 8.1.2; 8.5.1 e 8.3.2 em seguida; o resto quando houver tempo.

---

## 9. Implementação fase 2 (concluída)

Todos os itens da varredura fase 2 foram implementados:

- [x] **8.1.1 + 8.2.1** — `getThemeColorValues` em generate-drawio; refactor de getElementColors, getEdgeStrokeColor, getEdgeLabelColors.
- [x] **8.1.2** — `formatLinkLines` em parse-drawio; uso em pushElementLinks e emitEdgesToLines.
- [x] **8.1.3** — `toNonEmptyString` em generate-drawio; uso em navTo, iconName, edgeNavTo.
- [x] **8.3.1** — `getContainerDashedStyle`, `getDefaultStrokeWidth` em generate-drawio.
- [x] **8.3.2** — `applyStrokeColorOverride` em generate-drawio (substitui IIFE).
- [x] **8.5.1** — `elementHasBody`, `pushElementBody` em parse-drawio; emitElementToLines simplificado.
- [x] **8.5.2** — `packages/generators/src/drawio/xml-utils.ts` com escapeXml e decodeXmlEntities; generate-drawio e parse-drawio importam.
- [x] **8.5.3** — `DRAWIO_DOWNLOAD_REVOKE_MS` em useDrawioContextMenuActions (playground).
- [x] **8.2.2** — `buildCellOptionalFields` em parse-drawio; `buildCellFromMxCell` delega campos opcionais (SOLID).

---

## 10. Aderência ao system design do projeto

Avaliação da solução Draw.io face às abstrações e convenções do repositório (AGENTS.md, estrutura de generators e CLI):

- **Generators:** O módulo drawio segue o padrão dos outros formatos (d2, mmd, puml): funções de geração exportadas em `generate-drawio.ts`, re-export no `drawio/index.ts` e no `generators/src/index.ts`. A constante `DEFAULT_DRAWIO_ALL_FILENAME` está em `constants.ts` e é exportada pelo index principal (como referido no AGENTS: "Export to Mermaid, PlantUML, D2, etc." — drawio é mais um formato). O ficheiro `xml-utils.ts` é interno ao drawio (não exportado no package), alinhado com helpers locais noutros geradores.
- **CLI:** O handler `export/drawio/handler.ts` segue a mesma estrutura que `export/png` e `export/json`: comando registado em `export/index.ts` via `drawioCmd`, uso de `path`, `project`, `useDotBin` de `options`, logger e timer. Nomenclatura e responsabilidades (runExportDrawio, exportDrawioAllInOne, exportDrawioPerView) estão alinhadas com o resto do export.
- **Core/types:** Uso de `LikeC4ViewModel`, `ProcessedView`, `NodeId`, `BBox`, `LikeC4Styles`, `ThemeColorValues` e tipos do core mantém consistência com os outros geradores (puml, d2) que também recebem viewmodel e acedem a `$view`, `$styles`, cores e temas.
- **Convenções de código:** TypeScript explícito, sem `any`; JSDoc nas funções públicas; constantes partilhadas em `constants.ts`; formatação dprint. Não foi introduzido `switch(true)` no drawio porque as decisões são sobretudo por `shape`/`arrow` (switch por valor), já idiomáticas.
- **Testes:** Specs ao lado do código (`generate-drawio.spec.ts`, `parse-drawio.spec.ts`), snapshots em `__snapshots__`, nomes descritivos — em linha com as guidelines de testing.

Adequações já aplicadas nos refactors anteriores (constantes centralizadas, helpers com responsabilidade única, DRY entre generate e parse, xml-utils partilhado) reforçam a aderência. Nenhuma alteração adicional de alinhamento estrutural foi necessária.

---

*Documento gerado para apoiar um PR mais limpo da feature Draw.io export (branch `feat/drawio-export`).*
