# Changelog

## 0.8.1 — 2026-10-17

- Ficha de pergaminho, aba Testes: o nome do teste não corta mais em português ("Conhecimento" aparecia como
  "Conhecime…"). As linhas ficaram um pouco mais justas, e o nome completo aparece ao passar o mouse.

## 0.8.0 — 2026-10-17

Os poderes de gatilho dos itens viram habilidades, e os consumíveis de cura e dano funcionam sozinhos.

- **Poderes de gatilho dos itens.** Os 95 poderes "[Momento: …]" de 90 equipamentos e ferramentas do compêndio
  viram habilidades de item no personagem que carrega o item, uma por poder: Momento, Alvo, Alcance, Custo e
  Limite nos campos, o texto do poder (no idioma do item) como descrição e, em 30 deles, o efeito: Barreira,
  Regeneração, Anulação, Perseguição, Deterioração, Fraqueza, Atordoado, Rigidez, Voando, Oculto, Nadando,
  bônus de Recuperação e de rolagem de dano, cura e dano direto. A primeira habilidade fica ligada ao item. As
  habilidades chegam com o item e saem com ele; um personagem copiado fica com as suas.
- **Ficha de pergaminho:** um ícone por poder no item (numerados quando há mais de um); as habilidades de item
  saem da aba Habilidades.
- **Conferências das habilidades de item**, pela configuração dos limites de uso: o item equipado, a trava de NP
  ("〔NP21〕O efeito deste item não pode ser usado"), o Ódio mínimo, a Pré-Ação e os limites pelo NH de outra
  habilidade ("[NH de «Invocar Shikigami»] vezes por cena").
- **Momento Iniciativa** passa a ser conferido: só durante as rodadas do combate.
- **Itens de cura:** as Poções de Cura curam sozinhas ao usar (quem usa ou os personagens marcados), com o PV de
  antes e de depois no cartão, que perde o botão de rolar a cura de novo. As Joias do Renascimento e do Chamado
  da Vida curam o NP do alvo mais o bônus delas e levantam quem está Incapacitado; a do Chamado da Vida só em
  Curandeiros.
- **Consumíveis:** 17 venenos, areias mágicas, águas bentas e afins ganham o Dano (Teste e Dano no cartão de
  uso); 5 poções e joias ganham o estado que dão; 84 consumíveis com "(NP21): Este item não tem efeito" avisam a
  partir desse NP antes do uso, pelo botão Usar da ficha de pergaminho.
- O dano ou a cura de uma habilidade Pessoal tem o token do próprio usuário como alvo quando ninguém está marcado.
- Os efeitos completados pelo módulo levam o nome do item ou da habilidade como está no mundo (antes, em inglês).
- "Completar os dados do mundo" também cria e liga as habilidades dos poderes dos itens que os personagens já
  carregam, e apaga as de itens que eles não têm mais.
- API: `syncItemSkills(actor)`.

## 0.7.0 — 2026-10-17

As outras janelas do sistema no visual da ficha de pergaminho.

- **Fichas de item:** a barra verde no topo, o nome sobre a faixa verde com a imagem emoldurada, as tags como
  etiquetas, os números em duas colunas com rótulos em versalete sobre linhas pontilhadas e a barra clara de abas
  com arabescos. Teste e Dano das habilidades ganham o botão verde de rolar; o tipo da habilidade vira uma
  etiqueta. Cabeçalho, números e abas ficam parados e só o corpo rola. Efeitos sob barras verdes, habilidades
  iniciais em etiquetas emolduradas.
- **Ficha de monstro:** atributos em caixas, Esquiva e Resistência com o botão de rolar, estados e habilidades no
  visual da ficha; enviar ao chat vira um botão redondo na faixa.
- **Editor de efeitos:** cabeçalho na faixa verde, abas com ícones, linhas pontilhadas, as mudanças sob uma barra
  verde e o botão de salvar verde.
- **Seleção de habilidades e de classe**, diálogos de pontos de atributo, subida de NP, habilidades iniciais e
  rolagem, as confirmações abertas por essas janelas, baús, saques e lojas e as Ferramentas do Mestre.
- Fichas de compêndio trancado mostram os valores como texto, sem caixas apagadas.
- Nova configuração "Janelas do sistema em pergaminho" (ligada; pede para recarregar). O módulo só acrescenta
  classes às janelas: as fichas e os scripts do sistema continuam os mesmos.

## 0.6.0 — 2026-10-17

O chat refeito: mais curto, organizado e com rolagens novas.

- **Rolagens em faixa:** os dados como faces (6 em dourado, 1 com pontos vermelhos), o modificador e o total
  num selo; Crítico e Desastre nos testes (selo dourado ou escuro, com uma faixa de aviso), selo vermelho no
  dano e verde na cura. Os dados de uma rolagem nova caem rolando; a fórmula aparece ao passar o mouse.
- **Título das rolagens:** o tipo do teste em versalete e o nome em destaque, no lugar da linha de sabor.
- **Cartões de habilidade e de item:** Momento, Alvo e Alcance sob o nome; Teste e Dano em duas linhas; NH,
  Custo e Limite em etiquetas; a descrição dobrada (abre com um clique e continua aberta quando o cartão muda).
  O cartão de habilidade cai de ~690px para ~330px de altura.
- **Combate:** alvos e botões de aplicar cabem na barra lateral (antes os nomes longos e os botões vazavam);
  dano aplicado numa linha com o resultado em destaque.
- Fases da rodada como divisor fino; resumos e efeitos expirados sem título repetido e legíveis.
- Botões de Destino dourados, pequenos e legíveis.
- Os cartões antigos, escritos em outro idioma, também são reconhecidos.

## 0.5.5 — 2026-10-17

- Ficha de pergaminho: retrato pela metade, 128×128 (continua quadrado, a arte do token cabe inteira), com Raça,
  Classe e Subclasse ao lado; as tags voltam para baixo.

## 0.5.4 — 2026-10-17

Ajustes na ficha de pergaminho:

- Retrato quadrado de 256×256, para a arte do token caber inteira; Raça, Classe, Subclasse e as tags ficam ao
  lado dele.
- Sai o campo Guilda da ficha (o dado continua no personagem).
- Conexões e Uniões podem ser excluídas: × nas etiquetas da aba Personagem e a lixeira na Biografia, as duas
  com confirmação.
- Barra de PV vermelha, mais grossa.
- Ódio numa caixa laranja e Fadiga numa caixa azul, que enchem conforme o valor (o Ódio até 10; a Fadiga pela
  parte do PV máximo que ela tira).
- Testes de combate: Resistência do mesmo tamanho que Precisão e Esquiva.
- Sai o texto de ajuda da aba Testes.
- O título da faixa de abas acompanha a aba aberta mesmo quando a ficha redesenha durante a troca.

## 0.5.3 — 2026-10-17

- Ficha de pergaminho, aba Inventário: o boneco. Uma figura humana desenhada a pena no centro, com os sete
  espaços em volta, cada um ligado à parte do corpo que representa (acessórios na cabeça, no pescoço e nos
  ombros, armadura no peito, bolsa no quadril, armas nas mãos). A linha fica cheia com o ponto dourado quando o
  espaço está ocupado, e se destaca ao passar o mouse ou arrastar um item para o espaço. Os botões de cada item
  equipado aparecem por cima do cartão ao passar o mouse.
- A janela da ficha não fica mais estreita que 750px (o tamanho do boneco).

## 0.5.2 — 2026-10-17

- Ficha de pergaminho: sai o título "Log Horizon" do topo do estandarte; o estandarte começa direto nos Pontos
  de Vida.

## 0.5.1 — 2026-10-17

- Ficha de pergaminho: nas abas com sub-barra (Habilidades, Efeitos e estados, Biografia), os ícones redondos
  das abas ficavam cortados por baixo da sub-barra. Agora ficam por cima.

## 0.5.0 — 2026-10-17

A ficha de pergaminho: uma ficha nova, do tamanho e com a organização da ficha de Pathfinder 2e.

- **Ficha de personagem nova** (padrão; a do sistema continua disponível na configuração da janela), 750×750:
  estandarte verde à esquerda com PV, Barreira, Ódio, Fadiga, defesas em escudos, Iniciativa, Velocidade,
  Poder, testes de combate roláveis e estados ativos; cabeçalho com o nome, Destino em estrelas e o NP num
  brasão; abas Personagem, Testes, Habilidades, Inventário, Efeitos e estados, Biografia.
- **Habilidades agrupadas pelo Momento**, com NH, custo e limite, e os detalhes abertos no próprio lugar.
- **Inventário** com riqueza (receber, gastar e dar ouro), os sete espaços equipados, a lista do que se
  carrega, tíquetes e a barra de espaço.
- Texturas próprias (pergaminho, faixa e estandarte, geradas por `tools/make-textures.py`) e as fontes Eczar e
  Gelasio (OFL) no lugar de Cinzel e Crimson Pro; o chat usa as mesmas fontes.
- Sai o tema que recoloria a ficha do sistema (e a configuração "Tema pergaminho da ficha").
- O botão de remover Estado Negativo com Destino fica no quadro de Estados da ficha.

## 0.4.0 — 2026-10-17

O tema pergaminho no lugar da ficha Elder Tale.

- **A ficha volta a ser a do sistema**, com a moldura e o formato que só ela tem, agora em pergaminho e no
  verde original, com detalhes em dourado e fontes serifadas (Cinzel e Crimson Pro), no espírito das fichas
  de Pathfinder 2e. A arte da janela (moldura, janelas de Ódio e Fadiga, abas, botões, fundos dos itens) é
  recolorida pelo módulo.
- Do que a ficha Elder Tale acrescentava, ficou o que cabe no formato original: a barra de PV, as estrelas de
  Destino, o corpo atrás dos espaços de equipamento (ligados por linhas que acendem quando ocupados) e as
  pilhas de moedas por casa decimal ao lado do ouro.
- Saíram com ela o radar dos atributos, os cartões de habilidade na ficha, a barra de Ódio, os chips dos
  estados, a barra de capacidade do inventário e os botões de receber e gastar ouro.
- O chat no mesmo pergaminho: faixa verde no cabeçalho, dados como faces, total em destaque, e a cor do
  Momento na linha do título dos cartões de habilidade.
- Fonte Crimson Pro (OFL) no lugar da Source Sans 3.
- Configurações: **Tema pergaminho da ficha** (pede para recarregar) no lugar de "Ficha Elder Tale como
  padrão"; **Tema pergaminho no chat** no lugar de "Tema Elder Tale no chat".

## 0.3.0 — 2026-10-17

A ficha e o chat no visual Elder Tale.

- **Ficha Elder Tale**: nova ficha de personagem (padrão; a do sistema continua disponível na
  configuração da janela). Janela de vidro escuro com luz ciano, retrato hexagonal, emblema da classe,
  barras de PV e Ódio, estrelas de Destino, chips dos estados ativos, leitura de Ataque/Mágico/
  Recuperação/Defesas/Iniciativa, atributos em hexágonos com as perícias roláveis ao lado, radar dos
  atributos, habilidades em cartões coloridos pelo Momento com os pontos de NH, efeitos e estados
  reorganizados, boneco de equipamento com os sete espaços ligados ao corpo, grade de inventário com
  barra de capacidade e a bolsa de moedas com pilhas por casa decimal e botões de receber/gastar (com
  registro no chat).
- **Tema do chat**: cartões de habilidade, ataque, dano, aplicação, fases e os do módulo no mesmo
  visual, retrato de quem fala, dados como faces (6 em ouro, 1 em vermelho), total em destaque,
  acerto/erro/pendente com cores e o crítico brilhando.
- Fontes Cinzel e Source Sans 3 (OFL) incluídas.
- Com o `lhtrpg-pt-br` ativo, os cartões de habilidade da ficha mostram Momento, Alvo, Alcance, Custo
  e Limite em português.
- Novas configurações: Ficha Elder Tale como padrão; Tema Elder Tale no chat.

## 0.2.0 — 2026-10-17

Fase 2: o conteúdo dos compêndios. O que só existia no texto vira dado.

- Ataques de monstro: 81 habilidades do bestiário ganham o Dano. Monstros feitos à mão têm o dano lido do
  texto, em português ou inglês.
- 20 habilidades de classe ganham dano ou cura, como Racha-Elmo, Nebulosa de Relâmpagos, «Cura» e
  Ressurreição.
- Estados das habilidades: 21 de classe e 15 de monstros ganham o efeito ("o alvo sofre [Cambaleante]",
  "[Deterioração: 6]"…).
- Itens: 36 com bônus fixos, 43 com estados de início de cena (Anulação dos broches, cintos e talismãs) e 32
  pratos que tiram Fadiga.
- Tudo entra sozinho ao tirar algo dos compêndios. A nova ferramenta do Mestre **Completar os dados do
  mundo** cuida do que já existe. Nada editado à mão é trocado.
- Nova configuração: Completar os dados dos compêndios.

## 0.1.0 — 2026-10-17

Primeira versão: Fase 1, o núcleo do combate.

- Uso de habilidades: custos de Ódio e Destino, limites de uso por cena, cenário e rodada, Momento e economia
  de ações, registro no cartão com Desfazer uso.
- Topo e Abaixo no Ódio calculados por combate (vários combates ao mesmo tempo).
- Encerramento com Regeneração e Deterioração. Atordoado e Cambaleante acabam no fim do Processo Principal.
- Incapacitado automático; Incapacitados, Mortos e Ausentes passam a vez.
- Fim de cena ao encerrar o combate: recuperação, revive com Fadiga, inimigos morrem, estados acabam.
- Cartões: dano ligado ao ataque certo, botão de dano no cartão de ataque, guarda do Aplicar, cartões
  privados visíveis aos donos dos alvos.
- Destino: +1D, rerrolar acerto, esquiva e testes, remover Estado Negativo.
- Ferramentas do Mestre: encerrar cena e cenário.
