# Mapa 3D — Notas para implementação (SENAI HUB)

Documento de referência consolidado a partir do planejamento com o time/modelagem.  
**Status:** modelagem em andamento — implementação no app virá depois.

---

## Objetivo

Mapa interativo do campus no módulo **Grid**, rota existente: `/grid/mapa` (`GridTaskMapPage.tsx` — hoje placeholder “Mapa do campus em desenvolvimento”).

Montagem estilo **Lego**: blocos + secretaria, andares empilhados, salas clicáveis quando possível.

---

## Stack técnica

| Camada | Escolha |
|--------|---------|
| Web 3D | **Three.js** (provável **React Three Fiber** no frontend React) |
| Protótipo | Carregar **`.obj` + `.mtl`** (`OBJLoader` + `MTLLoader`) |
| Produção | Preferir **`.glb`** (glTF Binary) — mais leve e padrão web |

---

## Pipeline de assets (modelagem)

1. **Sweet Home 3D** — planta JPG de fundo, traçar paredes/cômodos, exportar OBJ.
   - Export: menu **Visão 3D → Exportar para o formato OBJ...** (não fica em Arquivo).
2. **Blender** (conversão opcional/recomendada para produção):
   - `Arquivo → Importar → Wavefront (.obj)`
   - Atenção à **escala**: Sweet Home exporta em **mm** → no Blender usar fator **`0.001`** para metros (ou manter consistente entre todos os blocos).
   - `Arquivo → Exportar → glTF 2.0` → formato **glTF Binary (.glb)**.
3. **Mesma escala** em todos os arquivos (Bloco A, B, C, D, Secretaria, cada andar).

### Estrutura de pastas atual

```
Arquivos/Map/
  JPG/          # plantas (Páginas 1–7)
  Obj/
    Bloco A/
      Bloco A.obj
      Bloco_A.mtl
  MAPA_3D_NOTAS_IMPLEMENTACAO.md  # este arquivo
```

Expandir conforme novos blocos/andares forem exportados (ex.: `Bloco A/terreo.obj`, `Bloco A/2andar.obj`).

---

## O que o export Sweet Home traz (Bloco A — validado)

O OBJ **não** é um bloco único: vem segmentado em grupos (`g`):

| Prefixo | Significado |
|---------|-------------|
| `ground_*` | Piso/chão geral |
| `wall_*_*` | Trechos de parede |
| `room_*_*` | **Cômodos/salas** (~140 grupos `room_` no Bloco A) |

**Importante:** nomes são IDs (`room_223_1331`), não “Laboratório 3”. Para UI legível, criar **mapa de nomes** (JSON/planilha): `room_223` → label, setor, andar, etc.

**Clicar em sala no Three.js:** filtrar meshes/grupos cujo nome começa com `room_`.

---

## Montagem “Lego” no código

Cada peça = um arquivo + transform no mundo:

```json
{
  "pieces": [
    { "id": "bloco-a-terreo", "file": "bloco-a-terreo.glb", "position": [0, 0, 0], "rotation": [0, 0, 0] },
    { "id": "bloco-a-p2", "file": "bloco-a-p2.glb", "position": [0, 0, 3.2], "rotation": [0, 0, 0] },
    { "id": "secretaria", "file": "secretaria.glb", "position": [12, 0, -8], "rotation": [0, 90, 0] }
  ]
}
```

Valores reais virão da documentação do modelador (colagem + regras abaixo).

---

## Como o modelador vai explicar o encaixe (combinado)

1. **Colagem** de todas as plantas (Canva/Paint/etc.) com rótulos claros:
   - Bloco A – térreo, Bloco A – 2º andar, Bloco B, Secretaria, etc.
   - Seta ou indicação de **norte** (ex.: “topo da imagem = norte”).
2. **Regra de alinhamento vertical:** *“Os andares seguintes se alinham no desenho das escadas.”*
   - Marco comum em **X/Y** para empilhar andares do **mesmo bloco**.
3. **3D:** andares superiores podem já vir **empilhados** no export OBJ/glb do Sweet Home — a colagem serve para **conferência** e encaixe **horizontal** entre blocos.
4. Para blocos lado a lado: colagem do **térreo geral** ou texto do tipo “Bloco B encosta na face leste do A”.

### O que planta sozinha NÃO resolve

- Posição exata entre Bloco A e B no eixo X/Y (sem colagem geral ou tabela).
- Rotação de um bloco inteiro.
- Altura entre andares — se o OBJ não vier empilhado, anotar pé-direito (ex.: 3,2 m) ou medir na planta.

---

## Peças previstas

- Bloco A (vários andares)
- Blocos B, C, D
- Secretaria
- (Futuro) mapear `room_*` → salas do sistema / chamados / tarefas no Grid

---

## Checklist antes de implementar no frontend

- [ ] Todos os OBJ/glb na pasta `Arquivos/Map/` (ou `public/models/map/`) com convenção de nomes clara
- [ ] Mesma escala em todos os exports
- [ ] Colagem das plantas + notas de encaixe (escadas, blocos)
- [ ] Lista: arquivo → descrição (ex.: “Bloco A, 2º andar”)
- [ ] (Opcional) JSON de posições Lego + JSON de nomes das salas
- [ ] Decidir: só OBJ no protótipo ou já glb
- [ ] Instalar deps: `three`, `@react-three/fiber`, `@react-three/drei` (se usar R3F)
- [ ] Integrar em `GridTaskMapPage` — carregar modelo(s), controles de câmera, highlight/click em `room_*`

---

## Referências rápidas

- IA/planta→3D automático: útil para **visual**, não para mesh precisa no app.
- Ferramentas modelagem: Sweet Home 3D → Blender → glb.
- Página alvo: `Senai HUB/frontend/src/pages/grid/GridTaskMapPage.tsx`

---

*Última atualização: maio/2026 — planejamento; implementação pendente.*
