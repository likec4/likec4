# Mapeamento LikeC4 ↔ Draw.io

Este documento lista **o que é mapeado** e **o que não é mapeado (perda na conversão)** em cada sentido, para deixar transparente o que pode se perder ao exportar/importar entre LikeC4 e Draw.io.

---

## 1. LikeC4 → Draw.io (exportação)

### 1.1 O que é mapeado

| LikeC4 | Draw.io | Observação |
|--------|---------|------------|
| **Visão (view)** | Um `<diagram>` (aba) por visão; `name` e `id` = view.id | Múltiplas views → múltiplas abas no .drawio |
| **Nó: id** | mxCell `id` (numérico interno) | Só para referência source/target |
| **Nó: título** | mxCell `value` (texto; se há description, HTML `<b>title</b><br/>desc`) | |
| **Nó: description** | style `likec4Description` (URI-encoded) + opcional no value HTML | |
| **Nó: technology** | style `likec4Technology` (URI-encoded) | |
| **Nó: notes** | style `likec4Notes` (URI-encoded) | |
| **Nó: tags** | style `likec4Tags` (URI-encoded, comma-separated) | |
| **Nó: navigateTo** | style `likec4NavigateTo` (URI-encoded) | |
| **Nó: icon** | style `likec4Icon` (URI-encoded) | |
| **Nó: shape** | style `shape=...` (rectangle, umlActor, cylinder3, document, etc.) | person→umlActor, cylinder/queue/storage→cylinder3 |
| **Nó: color** | style `fillColor`, `strokeColor`, `fontColor` (hex do tema) | Cores de tema/custom → hex |
| **Nó: posição e tamanho** | mxGeometry `x`, `y`, `width`, `height` | Do layout (bounds/bbox) |
| **Nó: hierarquia (parent)** | mxCell `parent` = id do pai ou da página | |
| **Aresta: source, target** | mxCell `source`, `target` (ids das células) | |
| **Aresta: label** | mxCell `value` | |
| **Aresta: description** | style `likec4Description` (URI-encoded) | |
| **Aresta: technology** | style `likec4Technology` (URI-encoded) | |
| **Aresta: notes** | style `likec4Notes` (URI-encoded) | |
| **Aresta: navigateTo** | style `likec4NavigateTo` (URI-encoded) | |
| **Aresta: head (seta)** | style `endArrow` (block, open, diamond, oval, none) | |
| **Aresta: tail (seta)** | style `startArrow` | |
| **Aresta: line** | style `dashed=1` e opcional `dashPattern=1 1` (dotted) | dashed/dotted/solid |
| **Aresta: color** | style `strokeColor` (hex) | Cor da relação no tema |

### 1.2 O que NÃO é mapeado (perda na exportação LikeC4 → Draw.io)

| LikeC4 | Motivo / destino no Draw.io |
|--------|-----------------------------|
| **View: title** | Não gravado no diagram; só o view.id vira nome da aba |
| **View: description** | Não existe conceito de “descrição da aba” no mxfile que usamos |
| **View: view rules (include/exclude, style rules)** | Draw.io não tem equivalente; só o resultado (nós/arestas) é exportado |
| **View: notation (nodes)** | Não exportado; só shape/color por nó já refletem o resultado |
| **Nó: summary** (separado de description) | No export usamos description; summary não é distinguido no value/style |
| **Nó: links** (array de Link) | Não há campo no mxCell para links; não exportado |
| **Nó: border** (BorderStyle) | Não mapeado para strokeWidth/border no style do Draw.io |
| **Nó: opacity** | Não mapeado para opacity no style |
| **Nó: style (size, padding, textSize, iconPosition, etc.)** | Apenas shape e color são mapeados; tamanho vem do layout (width/height), não do “style” LikeC4 |
| **Nó: notation** (por nó) | Não exportado como metadado |
| **Relação: kind** (ex.: `-[http]->`) | Não gravado no Draw.io; só a seta e o label; não existe “relationship kind” no style |
| **Relação: links** | Não há suporte para links na aresta no formato que usamos |
| **Relação: metadata** | Não exportado |
| **Relação: notation** | Não exportado |
| **Manual layout: waypoints / pontos de quebra da aresta** | Arestas são exportadas sem waypoints; Draw.io usa routing padrão |
| **Manual layout: drifts / mudanças finas de posição** | Só posição final do nó é usada; drifts não são escritos como pontos de controle |
| **Cores: nomes de tema** | Convertidos em hex no export; ao reabrir no Draw.io o usuário vê hex, não o nome do tema LikeC4 |
| **Specification: relationship kinds, custom colors** | Cores custom viram hex; relationship kinds não são anotados nas arestas |

---

## 2. Draw.io → LikeC4 (importação / parse)

### 2.1 O que é mapeado

| Draw.io | LikeC4 | Observação |
|---------|--------|------------|
| **Diagram (aba)** | Uma view única `index` com `include *` | Apenas o **primeiro** `<diagram>` do arquivo é usado; múltiplas abas não viram múltiplas views nomeadas |
| **mxCell vertex: value** | Título do elemento (strip HTML se vier como `<b>...</b><br/>`) | |
| **mxCell vertex: parent** | Hierarquia (FQN: parent.child) | parent=root → raiz; outro parent → filho |
| **mxCell vertex: style fillColor** | style `color <nome>` no elemento; cores hex viram `drawio_color_N` em specification | |
| **mxCell vertex: style strokeColor** | Não usado na emissão (só fillColor define cor no .c4) | |
| **style likec4Description** | `description '...'` no elemento | |
| **style likec4Technology** | `technology '...'` no elemento | |
| **style likec4Notes** | `notes '...'` no elemento | |
| **style likec4Tags** | `#tag1 #tag2` no corpo do elemento | |
| **style likec4NavigateTo** | `navigateTo <viewId>` no elemento | |
| **style likec4Icon** | `icon '...'` no elemento | |
| **mxGeometry (x, y, width, height)** | **Não** reemitido no .c4; o modelo LikeC4 não guarda posição no fonte | Layout é perdido no texto .c4 |
| **mxCell edge: source, target** | Relação `sourceFqn -> targetFqn` | |
| **mxCell edge: value** | Título da relação (primeiro string) | |
| **style likec4Description (edge)** | description da relação (segundo string ou body) | |
| **style likec4Technology (edge)** | technology da relação (terceiro string ou body) | |
| **style likec4Notes (edge)** | `notes '...'` no body da relação | |
| **style likec4NavigateTo (edge)** | `navigateTo viewId` no body da relação | |
| **style endArrow / startArrow** | `style { head ..., tail ... }` (mapeamento para normal, open, diamond, dot, none) | |
| **style dashed, dashPattern** | `style { line dashed }` ou `line dotted` | |

### 2.2 O que NÃO é mapeado (perda na importação Draw.io → LikeC4)

| Draw.io | Motivo / destino no LikeC4 |
|---------|----------------------------|
| **Múltiplas abas (diagrams)** | Todas as células de todos os diagramas não são mescladas; o parser usa um único diagram. Múltiplas abas → apenas uma view `index` no .c4; estrutura multi-view é perdida |
| **Nome do diagram (name/id do `<diagram>`)** | Não vira view.id ou view title no .c4; view é sempre `index` |
| **mxGeometry (x, y, width, height)** | Posição e tamanho não são escritos no .c4 (modelo é texto; layout é recalculado ou manual) | **Layout do Draw.io é perdido** |
| **style strokeColor (vertex)** | Não emitido no elemento (só fillColor vira `style { color }`) |
| **style strokeColor (edge)** | Cor da aresta no Draw.io não vira propriedade da relação no .c4 (LikeC4 não tem “cor da relação” no modelo; é por tema/regra) | **Cor da aresta é perdida** |
| **style fontSize, fontColor, fontStyle, fontFamily** | LikeC4 não tem esses campos por elemento; não emitidos | **Estilo de fonte é perdido** |
| **style strokeWidth** | Não mapeado para border no LikeC4 | **Espessura da linha é perdida** |
| **style opacity, shadow** | Não mapeados | **Opacidade e sombra são perdidas** |
| **style shape** (formas Draw.io que não sejam umlActor/swimlane/rectangle) | Inferimos apenas actor/system/container; formas específicas (cylinder, document, etc.) não são reemitidas como shape no .c4 | **Shape exato pode ser perdido** (tudo vira container/actor/system) |
| **mxUserObject / data keys** (além de likec4Description, likec4Technology) | Só lemos likec4* do style; outros user data são ignorados | **Dados custom do Draw.io são perdidos** |
| **Waypoints / pontos de controle da aresta** (mxGeometry Array) | Arestas no .c4 não têm waypoints; não emitimos | **Roteamento da aresta é perdido** |
| **edgeStyle, curved, elbow** | Não mapeados para nada no LikeC4 | **Estilo de rota da aresta é perdido** |
| **Layers** | Draw.io pode ter camadas; não distinguimos; tudo vira um único modelo | **Camadas são perdidas** |
| **Células que não são vertex nem edge** (ex.: group, outros) | Ignoradas | **Objetos não mapeados são perdidos** |
| **Conteúdo comprimido (base64/deflate)** | Descomprimido e lido; o formato em si não é “perdido”, só não é preservado no .c4 (que é texto) | — |
| **Imagens / imagens em shapes** | Não suportado no parse (value é texto/HTML) | **Imagens são perdidas** |
| **Links (href) em células** | Draw.io permite link na célula; não lemos nem emitimos como `link` LikeC4 | **Links do Draw.io são perdidos** |

---

## 3. Resumo de perdas críticas

- **LikeC4 → Draw.io:** view title/description, summary vs description, links, border/opacity, relationship kind, waypoints/drifts, nomes de cores (viram hex).
- **Draw.io → LikeC4:** layout (x, y, width, height), cor da aresta, múltiplas abas como múltiplas views, nome do diagram, estilo de fonte/linha/opacidade/sombra, waypoints e edge routing, shapes além de actor/system/container, imagens e links do Draw.io.

Para **round-trip completo** (LikeC4 → Draw.io → LikeC4), o que sobrevive bem são: elementos e relações com título, description, technology, notes, tags, navigateTo, icon, cor de preenchimento (como cor nomeada no spec), setas e estilo de linha das arestas. Layout e aparência avançada (fontes, bordas, opacidade, waypoints, múltiplas views/abas) não são preservados no formato .c4.

---

## 4. Itens implementados (round-trip)

**Export (LikeC4 → Draw.io):** view title como nome da aba e `likec4ViewTitle`/`likec4ViewDescription` na root cell; summary (`likec4Summary`); links (`likec4Links` JSON); border → `strokeWidth` + `likec4Border`; opacity no style; relationship kind e notation (`likec4RelationshipKind`, `likec4Notation`) na aresta; nome da cor (`likec4ColorName`) no vértice.

**Import (Draw.io → LikeC4):** nome do diagram → view id; `likec4ViewTitle`/`likec4ViewDescription` da root cell → view title/description; strokeColor da aresta → specification + `style { color }` na relação; opacity → `style { opacity }` no elemento; shape cylinder/document → `style { shape }`; summary, links, border, opacity, colorName, relationshipKind, notation emitidos no .c4.
