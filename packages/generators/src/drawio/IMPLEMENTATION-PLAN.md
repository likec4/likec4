# Plano de implementação completa – LikeC4 ↔ Draw.io

Este plano cobre os itens ainda **não mapeados** do `CONVERSION-MAPPING.md`, em ordem sistemática por fases.

---

## Fase 1 – Alta prioridade (round-trip e multi-diagram)

| # | Item | Sentido | Ação | Dependências |
|---|------|---------|------|--------------|
| 1.1 | **Múltiplas abas → múltiplas views** | Import | Parsear todos os `<diagram>`, produzir um modelo unificado + N views (uma por diagrama); cada view com `include` dos FQNs que aparecem naquele diagrama | ✅ Implementado: `parseDrawioToLikeC4Multi`, `getAllDiagrams` |
| 1.2 | **Layout (x, y, width, height)** | Import | Emitir layout em bloco de comentário ou extensão (ex.: `// likec4.layout { "index": { "nodes": {...} } }`) para ferramentas que suportem; ou documentar como perda conhecida | Decisão: comentário vs. não emitir |
| 1.3 | **strokeColor (vertex)** | Import | Ler strokeColor do style; emitir em `style { strokeColor X }` se o DSL suportar, ou como `likec4StrokeColor` em comentário para round-trip | Verificar se grammar tem stroke/borderColor |
| 1.4 | **Nó: notation (por nó)** | Export | Incluir `likec4Notation` no style do vértice quando existir | — |
| 1.5 | **Relação: links** | Export | Incluir `likec4Links` (JSON) no style da aresta quando existir; no import, emitir `link 'url' 'title'` no body da relação | — |

---

## Fase 2 – Melhoria de fidelidade (estilo e metadados)

| # | Item | Sentido | Ação | Dependências |
|---|------|---------|------|--------------|
| 2.1 | **strokeWidth (vertex)** | Import | Já temos likec4Border (solid/dashed/dotted); Draw.io strokeWidth é numérico. Guardar como `likec4StrokeWidth` no style na export; no import emitir em comentário ou campo futuro | — |
| 2.2 | **Relação: metadata** | Export | Incluir `likec4Metadata` (JSON ou string) no style da aresta; no import, emitir bloco `metadata { ... }` se o DSL suportar | Ver grammar metadata em Relation |
| 2.3 | **mxUserObject / data keys** | Import | Além de likec4*, ler outros `<data key="...">` e guardar como mapa; emitir como comentário ou props custom se houver convenção | — |
| 2.4 | **View: notation (nodes)** | Export | Não tem equivalente direto no Draw.io; opcional: gravar como `likec4ViewNotation` na root cell (JSON) para round-trip | — |
| 2.5 | **Nó: style (size, padding, textSize, iconPosition)** | Export | Gravar no style do vértice: likec4Size, likec4Padding, likec4TextSize, likec4IconPosition (quando existirem); no import, emitir em `style { ... }` | Verificar tokens do DSL (xs/sm/md etc.) |

---

## Fase 3 – Layout e roteamento (complexo)

| # | Item | Sentido | Ação | Dependências |
|---|------|---------|------|--------------|
| 3.1 | **Waypoints / pontos de quebra da aresta** | Export | Ler do viewmodel se houver edge waypoints; escrever `<mxGeometry><Array><Point>` no mxCell da aresta | Core/viewmodel expõe waypoints? |
| 3.2 | **Waypoints** | Import | Ler `<mxGeometry><Array>` da aresta; LikeC4 não tem waypoints no modelo; emitir em comentário ou extensão para ferramentas | — |
| 3.3 | **edgeStyle, curved, elbow** | Import | Ler do style; sem equivalente no .c4; documentar perda ou guardar em likec4EdgeStyle para round-trip | — |
| 3.4 | **Manual layout: drifts** | Export | Se o layout tiver drifts por nó, tentar refletir em offset na geometry; depende da estrutura do manual layout | Core layout format |

---

## Fase 4 – Limitações conhecidas (documentar ou rejeitar)

| # | Item | Sentido | Ação |
|---|------|---------|------|
| 4.1 | **View rules (include/exclude, style rules)** | Export | Sem equivalente no Draw.io; documentar como perda. Opcional: exportar como texto em likec4ViewRules na root cell |
| 4.2 | **Layers** | Import | Draw.io tem camadas; parser ignora. Opcional: filtrar por layer ou ler atributo layer e emitir comentário |
| 4.3 | **Células que não são vertex nem edge** | Import | Grupos e outros: decidir se criar elemento “group” ou ignorar; documentar |
| 4.4 | **Imagens / imagens em shapes** | Import | Não suportado; documentar. Export de ícones LikeC4 já vai como texto/nome |
| 4.5 | **Links (href) nativos Draw.io** | Import | Se a célula tiver link/href no Draw.io (não likec4Links), ler e emitir como `link 'url'` no elemento |

---

## Ordem de execução recomendada

1. **Fase 1.1** – Múltiplas abas → múltiplas views (maior impacto na importação).
2. **Fase 1.4 e 1.5** – Notation (nó) e links (relação) no export/import.
3. **Fase 1.2** – Layout: definir convenção (comentário JSON) e implementar leitura/escrita.
4. **Fase 1.3** – strokeColor no vértice (se o DSL permitir).
5. **Fase 2** – Itens 2.1–2.5 conforme prioridade do produto.
6. **Fase 3** – Waypoints e edge style só se o core/viewmodel expuser dados.
7. **Fase 4** – Atualizar `CONVERSION-MAPPING.md` e documentação de perdas.

---

## Critérios de conclusão por item

- **Export:** dado no LikeC4, ao exportar para Draw.io o dado aparece no XML (style/cell) e está documentado.
- **Import:** dado no Draw.io, ao importar para .c4 o dado aparece no fonte ou em comentário/extensão documentada.
- **Round-trip:** export → import → export preserva o dado (quando aplicável).
- **Teste:** teste automatizado cobre o novo mapeamento (snapshot ou assert).
- **Doc:** `CONVERSION-MAPPING.md` atualizado (mapeado vs. não mapeado).
