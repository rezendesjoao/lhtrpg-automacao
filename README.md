# Log Horizon TRPG — Automação

Módulo de extensão para o sistema **Log Horizon TRPG** (`lhtrpg` 2.1.x, Foundry VTT v14), feito para mesas
com muitos jogadores e vários combates ao mesmo tempo. Ele completa a automação que o sistema já tem: não
substitui fichas nem cartões, só acrescenta o que faltava e corrige o que quebrava em mesa grande.

Já tem a **Fase 1 — núcleo do combate**, a **Fase 2 — conteúdo dos compêndios** e a **ficha de pergaminho**,
com o chat e as outras janelas do sistema no mesmo visual, e o **Kuden**, uma regra da casa para assinaturas de
personagem. A **versão 1.0** trouxe o **HUD de ações**, uma barra acima da barra de macros para rolar e usar tudo
sem abrir a ficha, e as melhorias que vieram da análise dos módulos de Pathfinder 2e: ajudantes de turno, estados
clicáveis no chat e efeitos criados a partir de um cartão. As próximas fases (mesa por texto, cena e sessão,
regras de construção) estão listadas no fim.

## A ficha de pergaminho

Uma ficha de personagem nova, do tamanho e com a organização da ficha de Pathfinder 2e (750×750): um estandarte
verde à esquerda com o que se usa em jogo, o nome numa faixa escura, ícones redondos para as abas e o conteúdo
em pergaminho, com molduras finas e rótulos em versalete. Fontes Eczar e Gelasio, as mesmas da ficha de PF2e.
Ela usa toda a lógica da ficha do sistema (equipar, rolar, tíquetes, efeitos, navegador de habilidades).

- **Estandarte (barra lateral):** PV atual e máximo com a Barreira ao lado e uma barra vermelha do que resta;
  Ódio numa caixa laranja (com a coroa quando está no Topo) e Fadiga numa caixa azul, que enchem conforme o
  valor (o Ódio até 10; a Fadiga pela parte do PV máximo que ela tira); Defesa Física e Mágica em escudos, Iniciativa e Velocidade; Poder de
  Ataque, Mágico e de Recuperação; Precisão, Esquiva e Resistência com o número de dados, roláveis com um
  clique; e os estados ativos, com o botão de remover um Estado Negativo gastando Destino.
- **Cabeçalho:** nome, Destino em estrelas (clique soma 1, botão direito tira 1) e o NP num brasão, com o botão
  de subir de NP.
- **Personagem:** retrato quadrado de 128×128 (a arte do token cabe inteira) com Raça, Classe (com o emblema) e
  Subclasse ao lado; as tags; Conexões e Uniões como etiquetas, que se abrem com um clique e se excluem pelo ×
  (com confirmação); e os quatro atributos em molduras, com o botão de distribuir pontos.
- **Testes:** os oito testes de atributo e os três de combate em molduras, cada um com o modificador e os dados.
  Clique para rolar (pede o modificador).
- **Habilidades:** Básicas, Gerais e de Combate, agrupadas pelo Momento (Ação Maior, Menor, Movimento,
  Instantânea, Reações, Abertura, Encerramento, Constantes…), com NH, custo e limite. Clique na imagem para usar
  e no nome para abrir os detalhes ali mesmo; o botão Procurar abre o navegador de habilidades.
- **Inventário:** a riqueza com receber e gastar ouro (registrado no chat) e dar ouro; o boneco: uma figura
  humana desenhada a pena, com os sete espaços em volta, cada um ligado por uma linha à parte do corpo que
  representa (acessórios na cabeça, no pescoço e nos ombros, armadura no peito, bolsa no quadril, armas nas
  mãos). A linha fica cheia e o ponto dourado quando o espaço está ocupado, e se destaca ao passar o mouse ou ao
  arrastar um item para o espaço. Depois vêm a lista do que se carrega, os tíquetes e a barra de espaço da bolsa.
- **Efeitos e estados:** os efeitos temporários, passivos e inativos com fonte e duração, e o quadro de estados.
- **Biografia:** o texto, as Conexões e as Uniões.

A ficha vira o padrão dos personagens ao ativar o módulo. Qualquer ficha pode voltar à do sistema pelo menu de
configuração da janela (o ícone de ficha no cabeçalho). Itens e monstros ganham o mesmo visual nas fichas do
próprio sistema (veja "As outras janelas").

## O chat

As mensagens do sistema e do módulo ganham o mesmo pergaminho, mais curtas e organizadas para a barra lateral:

- **Rolagens:** uma faixa com os dados como faces (os 6 em dourado, os 1 com pontos vermelhos), o modificador e o
  total num selo. Testes mostram **Crítico** (dois ou mais 6) e **Desastre** (todos 1), com o selo dourado ou
  escuro; o dano tem o selo vermelho e a cura, verde. Os dados de uma rolagem nova caem rolando. Passe o mouse
  na faixa para ver a fórmula.
- **Título da rolagem:** "Teste de Atributo — Atletismo" vira um título com o tipo em versalete acima.
- **Cartões de habilidade e de item:** Momento, Alvo e Alcance numa linha sob o nome (o Momento com a sua cor),
  Teste e Dano em duas linhas, NH, Custo e Limite em etiquetas, e a descrição dobrada numa linha que abre com um
  clique (e continua aberta quando o cartão se atualiza).
- **Ataque e dano:** alvos numa linha cada, com distância, esquiva e resultado; os botões de aplicar cabem na
  barra lateral. O dano aplicado fica numa linha, com o resultado em destaque.
- **Fases da rodada** viram um divisor fino; os resumos não repetem o título.
- Os botões de Destino ficam dourados e pequenos, junto do que alteram.

As duas partes têm configuração própria ("Tema pergaminho no chat").

## As outras janelas

As janelas do sistema seguem a ficha: a barra verde no topo, pergaminho, o nome sobre a faixa verde com a imagem
emoldurada, rótulos em versalete sobre linhas pontilhadas, a barra clara de abas com arabescos e as barras
verdes nas listas.

- **Fichas de item** (os 14 tipos): os números em duas colunas; Teste e Dano das habilidades com o botão verde de
  rolar; o tipo da habilidade como uma etiqueta ao lado das tags. Cabeçalho, números e abas ficam parados e só o
  corpo rola. Num compêndio trancado os valores aparecem como texto.
- **Ficha de monstro:** os quatro atributos em caixas, Esquiva e Resistência com o botão de rolar, o painel de
  estados e a lista de habilidades no visual da ficha.
- **Editor de efeitos:** cabeçalho na faixa verde, abas com ícones, as mudanças sob uma barra verde.
- **Seleção de habilidades e de classe**, os diálogos de pontos de atributo, de subida de NP, de habilidades
  iniciais e de rolagem, as confirmações abertas por essas janelas, baús, saques e lojas, e as Ferramentas do
  Mestre.

As fichas e os scripts do sistema não mudam: o módulo só troca o visual. A configuração "Janelas do sistema em
pergaminho" desliga tudo isso (pede para recarregar).

## O HUD de ações

Com um token selecionado (ou, para um jogador, sem nenhum selecionado: o personagem atribuído a ele), aparece uma
barra de pergaminho logo acima da barra de macros, no visual da ficha:
- **Retrato** na faixa verde: clique para abrir a ficha; a seta recolhe o HUD só no retrato.
- **Recursos:** PV com a barra, Barreira, Destino em estrelas (clique +1, botão direito −1), Ódio (com a coroa do
  Topo) e Fadiga.
- **Turno:** a rodada e o Processo; no seu Processo Principal, as ações que ainda restam (Maior, Menor, Movimento),
  Espera e **Encerrar**; fora dele, Pré-Ação, Espera ou Pós-Ação. Num combate em que o token não está, **Entrar**
  coloca o token no combate com a Iniciativa dele.
- **Esquivas pendentes:** quando um ataque mira o seu personagem, aparece **Esquivar** com o atacante; o clique
  rola a Esquiva ou a Resistência pelo próprio botão do cartão (com o Mestre conectado, como no chat). Ataques que
  já tiveram dano rolado ou com mais de 20 minutos não contam.
- **Painéis** (um clique abre acima da barra, outro fecha; clicar no mapa ou Esc também fecha):
  - **Testes:** os oito testes por atributo e os de combate, com os dados. Clique rola; Shift ou botão direito pede
    o modificador, como na ficha. Um monstro mostra Esquiva e Resistência.
  - **Habilidades:** as que se usam (as Constantes ficam de fora), agrupadas por Momento, com NH, o custo que vai
    ser pago e os usos que restam em bolinhas. As que não dá para usar agora ficam esmaecidas, e o motivo aparece
    ao passar o mouse (fora do seu Processo, Ação Maior já usada, limite atingido, Incapacitado…). Clique usa
    (pelo mesmo caminho da ficha, com custos, limites e o Desfazer); **Shift + clique** usa e já rola o Teste.
  - **Kuden:** o Recurso (os losangos mudam o valor manual), o Núcleo e as peças por tipo.
  - **Itens:** o que está em mãos, com os poderes de gatilho de cada item, os poderes do resto do equipamento e os
    itens de uso (poções, joias) com a quantidade.
  - **Estados:** os estados e efeitos ativos, com × para remover, e o botão de Destino que remove um Estado Negativo.
- **Detalhes ao passar o mouse:** Momento, Teste, Alvo, Alcance, Dano, Custo, Limite, as tags e a descrição.
- **Atalhos fixos:** o alfinete de uma linha fixa a habilidade, o item ou o teste na própria barra (até 8, por
  personagem; os tokens de um mesmo monstro dividem os mesmos). Botão direito numa linha abre a ficha do item.
- **Teclado:** Esc fecha o painel aberto sem soltar o token. Recolher o HUD e abrir cada painel podem ganhar teclas
  em Configurar Controles (vêm sem tecla).
- **Telas menores:** quando falta espaço, os botões dos painéis viram só ícones (o nome aparece ao passar o mouse)
  e, no limite, o nome do personagem vai para o retrato.

Cada jogador liga ou desliga o HUD para si, e escolhe se ele mostra o personagem atribuído quando nada está
selecionado.

## O que ele faz

### Uso de habilidades
- **Custo de Ódio e Destino.** Ao usar uma habilidade, o Ódio do custo é somado (já com os descontos dos
  efeitos, como o do Arquifeitiço) e o Destino é descontado. O Ódio só conta em combate iniciado, porque ele
  zera no começo e no fim de todo combate. O Destino conta sempre, e é preciso tê-lo para usar.
- **Limites de uso.** 1/Cena, (NH)/Cenário, 1/Rodada, (NH+1)/Cena… são contados por personagem. A cena
  termina quando o combate é encerrado ou pela ferramenta do Mestre. O cenário só termina pela ferramenta.
- **Momento e economia de ações.** Em combate, o módulo confere:
  - Ação Maior, Menor, de Movimento e Instantânea: só no seu Processo Principal.
  - Abertura: só na Abertura. Encerramento: só no Encerramento.
  - Iniciativa: só durante as rodadas, no Processo de Iniciativa.
  - Briefing: antes de o combate começar.
  - A Ação Maior, a Menor e a de Movimento: cada uma só uma vez por Processo Principal.
- **Habilidades de itens.** Uma habilidade que vem de um item (os poderes de gatilho, em "Conteúdo dos
  compêndios", ou qualquer habilidade ligada a um item) segue a configuração dos limites de uso e também confere:
  - o item precisa estar equipado;
  - a trava de NP: "〔NP21〕O efeito deste item não pode ser usado" vale a partir desse NP;
  - o Ódio mínimo ("só quando seu Ódio for 10 ou mais") e a Pré-Ação ("Pessoal: Pré-Ação");
  - limites pelo NH de outra habilidade ("[NH de «Invocar Shikigami»] vezes por cena").
- **Incapacitado não age.** Um personagem Incapacitado (ou Morto) recebe o aviso antes de usar uma habilidade,
  pela configuração do Momento e economia de ações.
- **Avisar ou bloquear.** Quando algo não bate, o módulo pergunta se é para usar mesmo assim, ou bloqueia o
  jogador (o Mestre sempre pode forçar). Cada um tem a sua configuração.
- **Registro no cartão.** O cartão da habilidade ganha uma linha com o que foi gasto (ação, Ódio, Destino,
  uso n/máx) e um botão **Desfazer uso** para enganos. Ele devolve o Ódio, o Destino, o uso e a ação.

### Ódio
- **Topo e Abaixo no Ódio por combate.** O sistema calcula isso pelo combate que cada tela está vendo. Com
  vários combates ao mesmo tempo, quem estava em outro combate perdia o +2 na esquiva e o dano de Ódio. Agora
  o Mestre mantém os estados [Topo de Ódio] e [Abaixo no Ódio] em todos os personagens de cada combate. Todo
  mundo vê nos tokens quem está no Topo.

### Rodada
- **Encerramento.** No Processo de Encerramento, a Regeneração cura e depois a Deterioração causa dano,
  passando pela Barreira. O chat recebe um resumo por combate.
- **Atordoado e Cambaleante** acabam no fim do Processo Principal de quem os recebeu, a não ser que esteja
  Aflito.
- **Incapacitado.**
  - O personagem fica Incapacitado com PV 0, ou com PV máximo 0 por causa da Fadiga.
  - Quem fica Incapacitado vai a 0 PV.
  - Incapacitados, Mortos e Ausentes passam a vez: vão direto para Pós-Ação.
- **Fim de cena ao encerrar o combate.**
  - Os Aventureiros Incapacitados voltam com PV cheio.
  - Os Aventureiros Mortos revivem com 1 PV e [Fadiga: PV máx − 1].
  - Os inimigos Incapacitados morrem.
  - Acabam os Estados Negativos e de Combate; Fadiga e Fraqueza continuam.

### Turno
Cada jogador escolhe os seus (configurações de cliente):
- **Aviso da sua vez:** um aviso com som quando começa o Processo Principal de um personagem seu (ligado).
- **Selecionar o token na sua vez:** o token de quem começa o Processo fica selecionado para o dono, e o HUD passa
  a mostrar ele. Para o Mestre, vale para os inimigos e PdMs que nenhum jogador controla (desligado).
- **Levar a tela até quem age** (desligado).
- **Limpar os alvos no fim da sua vez:** quando acaba o Processo Principal de um personagem seu, os seus alvos são
  desmarcados, para a próxima habilidade não ir para o alvo antigo (ligado).

Combates simultâneos são acompanhados separadamente.

### Estados e efeitos a partir do chat
- **Estados clicáveis.** Os estados escritos nos cartões, em português ou inglês ([Atordoado], [Deterioração: 10],
  [Fraqueza (Chama): 5], [Barreira: NH×10]…), viram links. Um clique aplica o estado nos seus alvos (ou nos tokens
  selecionados) do mesmo jeito que o sistema aplica os efeitos das habilidades: um efeito com os dados do estado,
  que vale até o fim da cena e some com ele. Valores com NH usam o NH da habilidade do cartão; um valor que falta é
  perguntado. Tokens de outros jogadores recebem pelo Mestre.
- **Criar efeito nos alvos.** Botão direito num cartão de habilidade ou item no chat: um efeito com o nome, a
  imagem e o texto da habilidade, até o fim do Processo, da Rodada ou da Cena, para marcar um bônus ou uma
  penalidade que a habilidade só descreve em texto. Com um alvo só, a ficha do efeito abre para pôr as mudanças.

### Cartões de ataque e dano
- **O dano fica ligado ao ataque certo.** O sistema procura "o último ataque desta habilidade" só nas 30
  últimas mensagens. Num chat compartilhado ele se perdia e aplicava o dano sem o dano de Ódio, a Perseguição
  e a Fraqueza. Agora o cartão de ataque guarda de qual cartão de habilidade veio, e ganha um botão **Rolar
  dano** próprio.
- **Aplicar com segurança.**
  - Não aplica em quem ainda precisa rolar a Esquiva, nem em quem esquivou.
  - Pergunta antes de aplicar de novo no mesmo alvo.
  - Não aceita clique duplo.
- **Modo privado.** Cartões rolados em modo privado (Mestre, cego ou só para mim) também aparecem para os
  donos dos alvos e do atacante, que precisam deles para esquivar e aplicar.
- **Corpo a corpo encostado (regra da casa).** O sistema só aceita um ataque Corpo a corpo com os dois tokens no
  mesmo quadrado. Com esta opção, um token encostado no do atacante, de lado ou na diagonal, também conta como
  Corpo a corpo, e o cartão mostra o alvo como Corpo a corpo. As outras distâncias continuam as do sistema
  (a diagonal vale 2 quadrados). Vale no botão Teste do cartão da habilidade (e na rerrolagem com Destino) e no
  rótulo Teste da ficha do item.

### Destino
Cada botão gasta 1 Destino do personagem e fica marcado no cartão.
- **+1D** ao lado do Teste da habilidade. O dado extra entra como bônus de rolagem e aparece no cartão.
- **Rerrolar o acerto** (quem atacou) e **rerrolar a esquiva** (o dono do alvo) no cartão de ataque.
- **Rerrolar** qualquer outra rolagem 2D6 de um personagem (testes da ficha, por exemplo).
- **Remover um Estado Negativo:** botão Destino no quadro de Estados da ficha. Com Aflito, os estados que ele protege
  só saem depois dele.

### Conteúdo dos compêndios
Muita coisa dos compêndios do sistema só existia no texto. O módulo completa os dados que faltam.
- **Ataques de monstro.** 81 habilidades do bestiário (todos os ataques que causam dano) ganham o Dano.
  - O cartão de monstro passa a ter **Dano**.
  - O dano passa pela Defesa, Anulação, Barreira e dano de Ódio dos personagens, como os ataques dos
    jogadores.
  - Monstros feitos à mão também são lidos do texto, em português ou inglês: "[20+2D] de dano físico",
    "Causa [[/gmr 2d6 + 12]] de dano físico ao alvo", "37+2D physical damage"…
- **Habilidades de classe sem dano ou cura**, como Racha-Elmo, Nebulosa de Relâmpagos, Flecha de Labareda,
  Vento Gélido, Espinho do Picanço, Saya (Flecha), «Cura», Ressurreição e Prece de Cura. Somam 20.
- **Estados das habilidades.** "O alvo sofre [Cambaleante]", "[Deterioração: 6]", "[Fraqueza (Físico): …]":
  21 habilidades de classe e 15 de monstros ganham o efeito, que vai pelo botão **Aplicar efeitos**.
- **Bônus fixos dos itens.** 36 itens, como Manopla (+14 de Poder de Ataque), Cristal de Mana (+14 de Poder
  Mágico), Espada de Selamento: Yozakura (+6 de Recuperação), óculos e brincos (+1/+2 em perícias).
- **Estados de início de cena.** 43 itens dão o estado quando o combate começa, se estiverem equipados:
  broches, cintos, brincos, medalhões e talismãs de Anulação, e outros.
- **Comida.** 32 pratos tiram Fadiga de quem come: de quem usa, ou dos personagens marcados nos pratos para
  o grupo.
- **Poderes de gatilho dos itens.** "[Momento: Iniciativa] Você recebe [Barreira:60]. Uma vez por Cenário." Os
  95 poderes de 90 equipamentos e ferramentas viram habilidades de item, uma por poder, no personagem que
  carrega o item:
  - Momento, Alvo, Alcance, Custo ("& Destino 1", "& Ódio 2") e Limite ficam nos campos da habilidade, e o
    texto do poder vira a descrição, no idioma em que o item está;
  - 30 poderes têm o efeito: Barreira, Regeneração, Anulação, Perseguição, Deterioração, Fraqueza, Atordoado,
    Rigidez, Voando, Oculto e Nadando, bônus de Recuperação e de rolagem de dano, cura e dano direto. Os de alvo
    Pessoal vão para quem usa; os outros, para os alvos marcados (ou pelo botão **Aplicar efeitos**);
  - usa-se pelo ícone do item no inventário, com as conferências e o registro de qualquer habilidade (Momento,
    limite, custo, **Desfazer uso**). Na ficha de pergaminho cada poder tem o seu ícone, numerado quando o item
    tem mais de um, e eles não se repetem na aba Habilidades;
  - as habilidades chegam com o item (do compêndio, de outro personagem, numa cópia do personagem) e saem com
    ele. A primeira fica ligada ao item, como o sistema faz.
- **Itens de cura.** As Poções de Cura curam sozinhas ao usar: quem usa, ou os personagens marcados. O cartão
  mostra o PV de antes e de depois e perde o botão de rolar a cura de novo. As Joias do Renascimento e do
  Chamado da Vida curam o NP do alvo mais o bônus delas e levantam quem está Incapacitado; a do Chamado da Vida
  só funciona em personagens do arquétipo Curandeiro.
- **Consumíveis de dano e de estado.** 17 venenos, areias mágicas, águas bentas e afins ganham o Dano: o cartão
  de uso rola e o cartão de dano aplica. 5 poções e joias ganham o estado que dão (Regeneração, Barreira,
  Voando).
- **Trava de NP dos consumíveis.** "(NP21): Este item não tem efeito": 84 consumíveis avisam (ou bloqueiam) a
  partir desse NP, pelo botão Usar da ficha de pergaminho, como os limites de uso.

Só o que falta é preenchido. O que o Mestre editou à mão nunca é trocado.

### Ferramentas do Mestre
Ficam em **Configurações → Configurar Configurações → Log Horizon TRPG — Automação → Ferramentas do Mestre**.
- Encerrar a cena dos tokens selecionados.
- Encerrar o cenário dos tokens selecionados.
- Encerrar o cenário de todos os personagens.
- **Completar os dados do mundo.** Aplica o "Conteúdo dos compêndios" ao que já existe no mundo: itens,
  personagens, monstros e tokens. Dá aos personagens as habilidades dos poderes dos itens que eles já carregam,
  ligadas aos itens, e apaga as de itens que eles não têm mais. Mostra quanto vai mudar antes de mexer.
- **Ambiente (Kuden)** da cena exibida: hora do dia, céu aberto, escuridão e miasma.

### Kuden (regra da casa)
O Kuden dá a cada personagem uma assinatura própria (as bênçãos do Reinhard, o sol do Escanor), paga com as
mesmas escolhas de habilidade das oficiais. As regras estão em `Log Horizon TTRPG/kuden/Kuden-v0.1.md`, fora
deste repositório. O módulo cuida da parte de mesa:
- **Peças.** Uma habilidade vira peça do Kuden na aba **Kuden** da ficha dela: Núcleo (grátis), Técnica (2 PK
  por NH de Combate, 1 por NH Geral), Dom (1 PK), Dom maior (2 PK, ou 1 com Restrição Média ou Pesada) ou Ápice
  (4 PK). A mesma aba guarda a Restrição (Leve, Média ou Pesada) e a fraqueza, a origem no original e a régua ou
  gêmeo oficial. A peça ganha a tag Kuden.
- **Pontos de Kuden.** Uma escolha de Combate vale 2 PK e uma Geral, 1 PK. Pagar uma peça marca nela as escolhas
  gastas, do mesmo jeito que o navegador de habilidades do sistema marca as dele. Por isso:
  - a contagem de escolhas pendentes desconta o Kuden;
  - apagar a peça devolve as escolhas;
  - baixar o NP oferece desfazer as escolhas, como com qualquer habilidade.

  "Acertar PK" paga o que falta com as escolhas pendentes e devolve o que passou do custo (só 1 PK pode ficar
  guardado). Subir e descer o NH de uma Técnica paga ou devolve uma escolha.
- **Recurso.** O Núcleo pode definir um Recurso de 0 a 5:
  - **manual:** os círculos da ficha marcam o valor, e ele pode voltar a 0 no fim da cena;
  - **pela hora da cena:** um valor para cada hora do dia, que pode ir a 0 na escuridão (o Sol do Escanor).
- **Ambiente da cena.** Hora do dia, céu aberto, escuridão e miasma. O Mestre ajusta no fim da aba Ambiente da
  configuração da cena ou nas Ferramentas do Mestre. Um personagem lê a cena do seu token, a do combate em que
  luta ou a cena exibida.
- **Condições novas.** Ficam no mesmo editor de condições do sistema, nos efeitos e nas habilidades:
  - Recurso ≥ N e Recurso no máximo;
  - de dia, de noite, ao meio-dia, sob o céu aberto, na escuridão, em miasma e fora de miasma;
  - alvo Chefe ou Raide (entre os alvos marcados por quem usa);
  - PV ≤ N% do máximo.

  O efeito liga e desliga sozinho, e a aba Efeitos mostra a condição que falta.
- **Uso das peças.** Antes de usar uma peça, o módulo confere as condições da própria habilidade (as do sistema e
  as novas), pela configuração dos limites de uso. É assim que "só contra Chefe ou Raide" avisa ou bloqueia.
- **Aba Kuden da ficha de pergaminho.** Mostra:
  - o Núcleo e o Recurso;
  - os Pontos de Kuden, com as escolhas pendentes e os avisos;
  - as Técnicas, os Dons, os Dons maiores e o Ápice;
  - os Dons de cor (só história) e o ambiente da cena.

  Na aba Habilidades, as peças levam o selo Kuden.

## Configurações

Em Configurar Opções, as configurações do módulo vêm separadas por seção. As do mundo (só o Mestre muda) valem na
hora, sem recarregar, menos as janelas em pergaminho, que pedem para recarregar.

| Configuração | Padrão |
|---|---|
| Cobrar custos de Ódio e Destino | ligado |
| Limites de uso | avisar |
| Momento e economia de ações | avisar |
| Topo e Abaixo no Ódio por combate | ligado |
| Regeneração e Deterioração no Encerramento | ligado |
| Atordoado e Cambaleante acabam no fim do Processo Principal | ligado |
| Incapacitado automático | ligado |
| Fim de cena ao encerrar o combate | ligado |
| Aventureiros mortos revivem no fim da cena | ligado |
| Correções nos cartões de ataque e dano | ligado |
| Corpo a corpo alcança os quadrados vizinhos | ligado |
| Botões de Destino | ligado |
| Estados clicáveis no chat | ligado |
| Criar efeito a partir de um cartão | ligado |
| Completar os dados dos compêndios | ligado |
| Kuden (regra da casa) | ligado |
| Tema pergaminho no chat | ligado |
| Janelas do sistema em pergaminho | ligado |

"Limites de uso" e "Momento e economia de ações" têm três modos: **desligado**, **avisar** (pergunta se é
para usar mesmo assim) e **bloquear** (o jogador não consegue; o Mestre pode forçar).

Cada jogador escolhe as suas:

| Configuração | Padrão |
|---|---|
| HUD de ações | ligado |
| HUD sem token selecionado (mostra o seu personagem) | ligado |
| Aviso da sua vez | ligado |
| Selecionar o token na sua vez | desligado |
| Levar a tela até quem age | desligado |
| Limpar os alvos no fim da sua vez | ligado |

## Instalação

Requer o sistema `lhtrpg` 2.1.0 ou mais novo, no Foundry v14. O módulo
[`lhtrpg-pt-br`](https://github.com/rezendesjoao/lhttrpg-br) é recomendado.

No Foundry: **Módulos de Expansão → Instalar Módulo**, e cole no campo **URL do Manifesto**:

```
https://github.com/rezendesjoao/lhtrpg-automacao/releases/latest/download/module.json
```

Esse endereço sempre aponta para a versão mais recente, então o Foundry também avisa quando houver
atualização. Para instalar à mão, extraia o zip da [última versão](https://github.com/rezendesjoao/lhtrpg-automacao/releases/latest)
em `Data/modules/lhtrpg-automacao/`.

Depois ative o módulo no mundo, em **Gerenciar Módulos**, e confira as opções em **Configurar
Configurações → Log Horizon TRPG — Automação**.

## Para macros e outros módulos

```js
const api = game.modules.get("lhtrpg-automacao").api;
api.endScene(actors);             // encerra a cena desses atores
api.endScenario(actors);          // encerra o cenário (e a cena)
api.rollCheck(item, useMessage);  // Teste de uma habilidade, ligado ao cartão de uso
api.rollDamage(item, attackMsg);  // Dano contra um cartão de ataque específico
api.spendFate(actor);             // gasta 1 Destino
api.removeBadStatus(actor);       // diálogo de remover Estado Negativo com Destino
api.fillWorld({ dryRun: true });  // conta (ou completa) os dados que faltam no mundo
api.syncItemSkills(actor);        // cria e liga as habilidades dos poderes dos itens do personagem
api.parseMonsterDamage(html);     // lê o dano de um ataque de monstro escrito em texto
api.rollActorCheck(actor, token, "athletics", { ask: true }); // teste de perícia, como na ficha
api.applyStatus(actor, "decay", { value: 10 });             // aplica um estado como os efeitos de habilidade
api.hud();                        // o HUD de ações desta tela (refresh, togglePanel("skills"), closePanel)
api.kuden.ledgerOf(actor);        // Pontos de Kuden: custo, pago, guardado, escolhas pendentes, avisos
api.kuden.settle(actor);          // paga o que falta com as escolhas pendentes e devolve as sobras
api.kuden.resourceOf(actor);      // o Recurso do Núcleo (nome, valor, máximo, fonte)
api.kuden.setResource(actor, 3);  // muda um Recurso manual
api.kuden.sceneEnv(scene);        // o ambiente de uma cena (hora, céu aberto, escuridão, miasma)
```

## Limites conhecidos

- **Reações** (Antes/Após o Teste, Antes/Após o Dano, Rolagem de Dano) ainda não são oferecidas na hora
  certa. Elas são a Fase 3.
- **Desfazer uso** devolve custos e contagens, mas não apaga os efeitos que a habilidade aplicou.
- **+1D** existe no Teste das habilidades pelo cartão. Nos testes de perícia feitos pela ficha só há a
  rerrolagem.
- **Custos de grupo** ("(Party)", "(Allies)") não aparecem em nenhuma habilidade do compêndio. Se algum
  aparecer, o usuário paga o próprio e os aliados pagam à mão.
- **Dano rolado pela ficha**, fora do cartão da habilidade, ainda usa a busca do próprio sistema.
- **Poderes de itens:**
  - 65 dos 95 poderes ficam só com os campos, o texto e a contagem de usos e custos: os que dependem de uma
    escolha (a tag da Redução da Guarda da Égide), de um resultado ("se o Ataque Mágico infligir…"), de outra
    habilidade («Cura», «Ressurreição») ou do Ódio no valor, e os que mexem em objetos de cena, movimento, tags
    ou Conexões. O efeito deles é feito à mão.
  - "Na próxima rolagem de dano" vale até o fim da rodada (ou do processo, nos poderes de Momento Rolagem de
    Dano). "Soma à intensidade" (Regeneração da Lâmina do Tumulto, Deterioração do Açoite de Labrin) fica como o
    maior valor, como qualquer estado.
  - O Destino que alguns poderes dão (Peitoral da Donzela Guerreira, Armadura do Farol) e a tag [Quebrado] são à
    mão. As Joias do Renascimento e do Chamado da Vida não somam o Ódio delas (+2 / +1).
  - Na ficha do sistema, a segunda habilidade de um item com dois poderes aparece entre as habilidades de
    Combate (o ícone do item só usa a primeira).
  - Apagar à mão a habilidade de um poder desliga o item; "Completar os dados do mundo" cria de novo. Um item
    ligado à mão a uma habilidade própria fica como está.
  - O dano dos consumíveis não leva a tag do elemento ([Frio], [Choque]…), que continua só no texto.
- **Conteúdo que ainda é só texto:**
  - "conta como tendo «Habilidade» com NH+N" (14 itens);
  - estados com condição ("(Menor): o alvo sofre…", "Resultado 17+…");
  - venenos de Fadiga;
  - danos que dependem do escudo, como Golpe de Escudo e Escudo Sagrado.
- **Os estados das habilidades** entram pelo botão **Aplicar efeitos**, depois do acerto. Aplicar sozinho no
  acerto é a Fase 3.
- **Kuden:**
  - A condição de alvo Chefe ou Raide é lida nos alvos de quem está usando o Foundry naquele momento. O efeito
    atualiza para o personagem do jogador, para os tokens selecionados e para as fichas abertas.
  - As condições novas não valem nos efeitos que uma habilidade aplica em outro personagem (o sistema só confere
    as dele nesse caso).
  - Os efeitos que nenhuma condição descreve (o primeiro ataque da luta erra, filtrar por tipo de ataque) ficam
    com o Mestre.
- **Erro do core 14.367 no console.** Com combates simultâneos, aparece
  `Cannot use 'in' operator to search for 'turn'`. Ele vem do rastreador de combate do Foundry, não do módulo,
  e é inofensivo: só afeta a rolagem automática da lista.

## Testado

Foundry 14.367, `lhtrpg` 2.1.0 e `lhtrpg-pt-br` 1.0.1. Cenários testados num mundo de teste:
- Custos de Ódio e Destino, limite por cena (com aviso, uso forçado e desfazer).
- Ação Maior repetida e Momento fora do Processo Principal.
- Topo e Abaixo no Ódio em dois combates simultâneos.
- Teste e dano ligados mesmo com 35 mensagens no meio.
- Aplicar com esquiva pendente, depois de esquivar e de novo.
- Cartão privado visível ao dono do alvo.
- Destino: +1D, rerrolar acerto, esquiva e teste comum, remover Estado Negativo com Aflito.
- Encerramento com Regeneração, Deterioração e Barreira.
- Atordoado terminando no fim do turno; Incapacitado com PV 0 e perdendo a vez.
- Fim de cena com recuperação, morte do inimigo e revive com Fadiga.
- Ferramentas do Mestre.
- Fase 2:
  - Monstros importados do bestiário com dano e estados.
  - Ataque de monstro contra PJ, passando pela esquiva, Defesa, dano de Ódio e Deterioração aplicada.
  - Habilidades de classe tiradas do compêndio com dano, cura e estado.
  - Bônus de item (Manopla +14) e Anulação de início de cena (Broche).
  - Comida tirando Fadiga.
- Kuden, num Samurai NP 1 e NP 2, em inglês e em português:
  - Peças pagas com as escolhas pendentes, inclusive faltando PK, sobrando PK e "Acertar PK".
  - NH de Técnica subindo e descendo; apagar devolvendo as escolhas.
  - Baixar o NP oferecendo desfazer o Ápice escolhido no NP 2.
  - Recurso pela hora (meio-dia 5, noite 0, escuridão 0) e manual (círculos, −1, zerar no fim da cena).
  - Efeitos com Recurso ≥ 5, de noite, PV ≤ 50% e alvo Chefe ligando e desligando.
  - Ápice "só contra Chefe" pedindo confirmação sem alvo.
  - Ambiente pela configuração da cena e pelas Ferramentas do Mestre.
  - "Completar os dados do mundo" em monstros antigos, num monstro feito à mão em português, num item
    achado pelo nome e em tokens não vinculados.
- A leitura do dano dos 75 ataques do bestiário dá o mesmo resultado no texto em inglês e no texto traduzido
  pelo `lhtrpg-pt-br`.
- Ficha de pergaminho: todas as abas; Destino pelas estrelas, Barreira, Ódio e PV editados no estandarte;
  rolagem de teste; receber e gastar ouro com o registro no chat; equipar e desequipar, inclusive arrastando
  para os espaços do boneco; criar conexão; detalhes
  de habilidade abertos e mantidos entre atualizações; usar habilidade pela imagem (com os avisos de ação);
  nenhum erro no console. No chat, o cartão de habilidade com o uso registrado, o Teste e o botão de Destino.
- Janelas em pergaminho, em inglês e em português: fichas de acessório, arma, consumível, classe (habilidades
  iniciais), subclasse e habilidade (com condições e efeitos), editáveis e de compêndio trancado; ficha de monstro
  em todas as abas; editor de efeitos em todas as abas; seleção de habilidades (escolher e desfazer) e de classe;
  diálogos de rolagem, de exclusão, de pontos de atributo, de subida de NP e de habilidades iniciais; loja e saque;
  Ferramentas do Mestre; a configuração desligada devolve o visual do sistema.
- Poderes de itens e consumíveis:
  - R10 Hikari no kōshi tirado do compêndio: a habilidade criada e ligada. Equipado e usado pelo ícone do
    inventário: aviso de Momento na Abertura; na Iniciativa, Barreira 60 aplicada e "Uso 1/1 por cenário" no
    cartão; no segundo uso, os avisos do limite e da trava com NP 21; o limite volta no cenário seguinte; aviso
    de item não equipado.
  - Poção de Cura I pelo botão Usar da ficha: PV 80 → 105, sem o botão de rolar a cura no cartão. Joia do
    Renascimento I (cura o NP do alvo) e Joia do Chamado da Vida num Samurai (sem efeito). Trava de NP de um
    consumível avisando antes do uso.
  - Armadura do Cavaleiro do Graal: cura de 100 pelo cartão, com o próprio personagem como alvo.
  - Esmagador de Minos dando Fraqueza (Física) 7 ao alvo marcado; Varinha Kodama com +6 no dano de Ataque
    Mágico; Kōryū no tsume com o limite pelo NH de «Ação de Kung Fu» e o aviso de Pré-Ação.
  - Veneno de Maldição III com Teste e Dano no cartão de uso; Poção de Regeneração III dando Regeneração 15.
  - "Completar os dados do mundo" num personagem que já tinha os itens: 5 habilidades criadas e 3 itens
    ligados; rodar de novo não acha mais nada. Apagar o item apaga as habilidades; apagar a habilidade desliga o
    item.
  - Itens com o texto do `lhtrpg-pt-br`: cada habilidade com o seu poder em português. Personagem copiado com os
    itens ligados às habilidades da cópia.
- Corpo a corpo encostado: ataque Corpo a corpo de monstro em personagem de lado, na diagonal e no mesmo quadrado
  (cartão criado, alvo como Corpo a corpo); a 2 quadrados continua o aviso do sistema; com a opção desligada volta
  o aviso a 1 quadrado. Pelo botão Teste do cartão (com e sem as correções dos cartões) e pelo rótulo Teste da
  ficha do item, sempre um cartão só. Habilidade de 4 quadrados com as distâncias de antes (4 aceita, 5 recusa,
  diagonal vizinha conta 2).

Versão 1.0 (mesmo ambiente, em português e em 1024 e 1600 px de largura):
- HUD de personagem e de monstro: recursos, testes (com e sem modificador), habilidades por Momento com os motivos
  de não poder usar, Shift + clique (cartão e Teste ligados), Kuden com o Recurso manual, itens em mãos com os
  poderes e itens de uso, estados com remoção, atalhos fixos de teste e de habilidade, Esc e recolher.
- Esquiva pelo HUD com o Mestre (rolada e gravada no cartão) e, como jogador sem Mestre, o aviso do sistema.
- Jogador sem token selecionado vendo o próprio personagem; turno com as ações restantes, Espera e Encerrar.
- Estados clicáveis com valor, com tag em português (vira a tag do catálogo), com valor perguntado e sem valor.
- Criar efeito nos alvos com duração do sistema; seleção do token na vez e alvos limpos no fim do Processo.

## Dados dos compêndios

O arquivo `scripts/content/patches.mjs` é gerado a partir das fontes do sistema `lhtrpg` (`src/packs`). Depois
de uma atualização do sistema, gere de novo com o clone do sistema ao lado desta pasta:

```bash
node tools/build-patches.mjs ../LHTTRPG
```

O script lê o texto em inglês dos compêndios (`tools/text-rules.mjs`, `scripts/content/monster-damage.mjs`) e
usa as tabelas revisadas à mão dentro dele: dano das habilidades, exceções, os poderes dos itens (`POWERS`:
alvo, alcance, efeitos e condições de cada poder) e os consumíveis (`USABLE_DAMAGE`, `USABLE_HEAL`,
`USABLE_STATUSES`). Ele imprime as listas para revisão e avisa dos poderes sem revisão ou com campos que o
sistema não reconhece.

## Publicar uma nova versão

1. Aumente `version` no `module.json` e troque a versão no fim da URL de `download`
   (`.../releases/download/vX.Y.Z/lhtrpg-automacao.zip`); registre a mudança no `CHANGELOG.md`.
2. `node tools/package.mjs` gera `dist/lhtrpg-automacao.zip` e `dist/module.json`.
3. Faça commit e push, e crie a release com os dois arquivos de `dist/`:

```bash
gh release create vX.Y.Z dist/module.json dist/lhtrpg-automacao.zip --title "vX.Y.Z" --notes "..."
```

## Créditos e aviso

Log Horizon e Log Horizon TRPG (ログ・ホライズンTRPG) pertencem a Mamare Touno e à Kadokawa. Este é um módulo de
fãs, não oficial e sem vínculo com os detentores dos direitos. O sistema para Foundry é de Kyane (Tenyryas) e
DeadlyPoisonK; este módulo só acrescenta automação a ele. O código é distribuído sob a licença MIT
([LICENSE.txt](LICENSE.txt)); a licença não cobre o conteúdo de regras de Log Horizon TRPG.

Ideias da versão 1.0 vieram da análise de módulos de Pathfinder 2e e de HUDs para Foundry: PF2e HUD e PF2e Toolbelt
(reonZ), Token Action HUD (Larkinabout), PF2e Workbench (xdy), PF2e Extempore Effects (shemetz), PF2e Ctrl-Click
Effects (websterguy), Sundry (ChasarooniZ), PF2e Utility Buttons (oWave), PF2e Dailies (reonZ), PF2e Keybind
Menagerie (Drental), PF2e Usage Updater (ChasarooniZ) e PF2e Companion Compendia (TikaelSol). Nenhum código deles
foi copiado: as funções foram escritas do zero para as regras e o sistema de Log Horizon. A análise completa está em
[docs/ANALISE-MODULOS-PF2E.md](docs/ANALISE-MODULOS-PF2E.md).

A organização e o estilo da ficha seguem a ficha do sistema Pathfinder Second Edition para Foundry; nenhuma arte
dele é usada (as texturas são geradas por `tools/make-textures.py`). As fontes Eczar e Gelasio são distribuídas
sob a SIL Open Font License ([fonts/OFL-eczar.txt](fonts/OFL-eczar.txt), [fonts/OFL-gelasio.txt](fonts/OFL-gelasio.txt)).

## Próximas fases

3. **Mesa por texto:** alvos sem precisar do mapa, esquiva e aplicação automáticas pelo Mestre, janela de
   reações, comandos de chat, permissões dos botões.
4. **Cena e sessão:** Pós-Jogo, +1 Destino por fase, Tíquetes de Registro funcionais, loja.
5. **Ficha e construção:** Poder Mágico, equipar, limites de [Treinamento], proficiências.
