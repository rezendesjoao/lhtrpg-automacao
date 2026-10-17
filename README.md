# Log Horizon TRPG — Automação

Módulo de extensão para o sistema **Log Horizon TRPG** (`lhtrpg` 2.1.x, Foundry VTT v14), feito para mesas
com muitos jogadores e vários combates ao mesmo tempo. Ele completa a automação que o sistema já tem: não
substitui fichas nem cartões, só acrescenta o que faltava e corrige o que quebrava em mesa grande.

Esta é a **Fase 1 — núcleo do combate**. As próximas fases (conteúdo dos compêndios, mesa por texto, cena e
sessão, regras de construção) estão listadas no fim.

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
  - Briefing: antes de o combate começar.
  - A Ação Maior, a Menor e a de Movimento: cada uma só uma vez por Processo Principal.
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

### Destino
Cada botão gasta 1 Destino do personagem e fica marcado no cartão.
- **+1D** ao lado do Teste da habilidade. O dado extra entra como bônus de rolagem e aparece no cartão.
- **Rerrolar o acerto** (quem atacou) e **rerrolar a esquiva** (o dono do alvo) no cartão de ataque.
- **Rerrolar** qualquer outra rolagem 2D6 de um personagem (testes da ficha, por exemplo).
- **Remover um Estado Negativo:** estrela ao lado do Destino na ficha. Com Aflito, os estados que ele protege
  só saem depois dele.

### Ferramentas do Mestre
Ficam em **Configurações → Configurar Configurações → Log Horizon TRPG — Automação → Ferramentas do Mestre**.
- Encerrar a cena dos tokens selecionados.
- Encerrar o cenário dos tokens selecionados.
- Encerrar o cenário de todos os personagens.

## Configurações

Todas são do mundo (só o Mestre muda) e valem na hora, sem recarregar.

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
| Botões de Destino | ligado |

"Limites de uso" e "Momento e economia de ações" têm três modos: **desligado**, **avisar** (pergunta se é
para usar mesmo assim) e **bloquear** (o jogador não consegue; o Mestre pode forçar).

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
- **Erro do core 14.367 no console.** Com combates simultâneos, aparece
  `Cannot use 'in' operator to search for 'turn'`. Ele vem do rastreador de combate do Foundry, não do módulo,
  e é inofensivo: só afeta a rolagem automática da lista.

## Testado

Foundry 14.367, `lhtrpg` 2.1.0 e `lhtrpg-pt-br` 1.0.0. Cenários testados num mundo de teste:
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

## Próximas fases

2. **Conteúdo:** conversor dos ataques de monstro (texto → Teste/Dano), ataques e curas de classe sem dados,
   efeitos dos itens mágicos.
3. **Mesa por texto:** alvos sem precisar do mapa, esquiva e aplicação automáticas pelo Mestre, janela de
   reações, comandos de chat, permissões dos botões.
4. **Cena e sessão:** Pós-Jogo, +1 Destino por fase, Tíquetes de Registro funcionais, loja.
5. **Ficha e construção:** Poder Mágico, equipar, limites de [Treinamento], proficiências.
