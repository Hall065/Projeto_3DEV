# Implementação do Mapa 3D do Campus SENAI

## Objetivo

Implementar um visualizador 3D do campus SENAI utilizando Three.js para apoio ao sistema de infraestrutura e chamados internos.

Neste primeiro momento NÃO será realizado controle por sala individual.

A navegação será feita por blocos do prédio.

---

# Arquivos Disponíveis

Modelos exportados em formato GLB:

* BlocoA.glb
* BlocoB.glb
* BlocoC.glb
* BlocoD.glb

Os arquivos já foram alinhados e posicionados corretamente no Blender.

Ao carregar todos os modelos simultaneamente eles devem formar o campus completo.

---

# Requisitos da Primeira Versão

## Carregamento

Utilizar:

* Three.js
* GLTFLoader

Carregar os 4 blocos automaticamente.

---

## Navegação

Permitir:

* Rotação livre (OrbitControls)
* Zoom
* Pan

A câmera deve iniciar mostrando o campus completo.

---

## Seleção de Bloco

Ao clicar em um bloco:

* Identificar qual bloco foi selecionado.
* Centralizar a câmera no bloco.
* Destacar visualmente o bloco selecionado.

---

## Destaque Visual

Quando um bloco for selecionado:

Bloco selecionado:

* Opacidade 100%

Demais blocos:

* Opacidade entre 10% e 30%

Exemplo:

Bloco C selecionado:

* Bloco A = 20%
* Bloco B = 20%
* Bloco C = 100%
* Bloco D = 20%

---

## Painel de Informações

Criar estrutura para exibição de:

* Nome do bloco
* Quantidade de chamados
* Quantidade de chamados abertos
* Quantidade de chamados concluídos

Os dados poderão ser simulados inicialmente.

---

## Estrutura Esperada

Campus

* Bloco A
* Bloco B
* Bloco C
* Bloco D

Cada bloco deve possuir identificação própria para permitir integração futura com chamados.

---

# Funcionalidades Futuras (não implementar agora)

## Salas

Inicialmente NÃO haverá separação por salas.

A associação de chamados será feita por bloco.

---

## Marcadores

Planejado para versões futuras:

* Marcadores por sala
* Marcadores por laboratório
* Marcadores por setor

---

## Integração com Banco

Planejado para versões futuras:

* API de chamados
* Histórico de manutenção
* Fotos
* Status em tempo real

---

# Requisitos Técnicos

## Performance

Os modelos possuem aproximadamente:

* 57.500 vértices
* 103.000 faces
* 109.000 triângulos

Não realizar simplificação de malha neste momento.

---

## Organização

Ao carregar cada GLB:

* Registrar referência do objeto
* Armazenar em coleção/lista de blocos
* Permitir controle individual de visibilidade e opacidade

---

# Verificação Inicial

Após carregar os GLBs executar:

gltf.scene.traverse((obj) => {
console.log(obj.name);
});

Objetivo:

Mapear todos os meshes e estruturas internas exportadas pelo Blender para possíveis controles futuros (paredes, portas, escadas etc).

---

# Resultado Esperado

O usuário deve conseguir:

1. Visualizar o campus completo.
2. Navegar livremente.
3. Selecionar um bloco.
4. Destacar o bloco selecionado.
5. Visualizar informações associadas ao bloco.
6. Preparar a estrutura para integração futura com o sistema de chamados.
