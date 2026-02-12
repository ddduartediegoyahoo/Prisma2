# PRD — Adapte Minha Prova

## Visão Geral

O **Adapte Minha Prova** é um webapp B2C voltado para professores que precisam adaptar avaliações escolares para estudantes com necessidades educacionais específicas (DI, TEA, dislexia, disgrafia, discalculia, TDAH, entre outras). O sistema recebe o PDF de uma prova, extrai as questões (inclusive via OCR), identifica automaticamente as habilidades BNCC e o nível cognitivo Bloom de cada questão, e gera versões adaptadas por meio de agentes de IA — preservando o objetivo de aprendizagem e os elementos visuais originais. Existem dois papéis: **Professor** (usuário final) e **Administrador** (gestão de modelos, agentes, apoios e usuários).

## Objetivos

- Reduzir significativamente o tempo que o professor gasta para adaptar uma prova manualmente.
- Manter a integridade pedagógica: mesma habilidade BNCC e nível Bloom entre a questão original e a adaptada.
- Coletar feedback do professor para melhoria contínua das adaptações.
- **KPIs de qualidade:**
  - Nota do professor por questão adaptada (1–5 estrelas).
  - Percentual de questões copiadas pelo professor (indica utilidade).
  - Nota total média por prova.
  - Quantidade de provas enviadas para adaptação.

## Histórias de Usuário

### Professor

- Como professor, quero fazer upload de um PDF da minha prova para que o sistema extraia as questões automaticamente.
- Como professor, quero informar disciplina, ano/série e tema para que a adaptação tenha contexto pedagógico correto.
- Como professor, quero selecionar uma ou mais necessidades educacionais (apoios) para gerar versões adaptadas específicas.
- Como professor, quero informar as alternativas corretas de cada questão extraída para que a adaptação preserve a resposta esperada.
- Como professor, quero visualizar a análise BNCC e Bloom de cada questão para entender o alinhamento curricular.
- Como professor, quero copiar o texto adaptado de cada questão para colá-lo no meu documento de prova.
- Como professor, quero avaliar e comentar cada adaptação para contribuir com a melhoria do sistema.
- Como professor, quero acessar o repositório das minhas provas adaptadas anteriores para consultá-las quando necessário.
- Como professor, quero que o processamento seja assíncrono para poder sair e voltar quando a adaptação estiver pronta.

### Administrador

- Como administrador, quero cadastrar e gerenciar modelos de IA (URL + API Key) para configurar quais LLMs o sistema utiliza.
- Como administrador, quero criar, editar e gerenciar agentes (prompts) para definir o comportamento de adaptação.
- Como administrador, quero cadastrar apoios (necessidades educacionais) vinculando-os a um agente e um modelo para disponibilizá-los aos professores.
- Como administrador, quero habilitar/desabilitar modelos, agentes e apoios sem removê-los.
- Como administrador, quero visualizar a lista de usuários registrados e bloquear o acesso de um usuário quando necessário.
- Como administrador, quero evoluir um agente com base no feedback dos professores para melhorar continuamente a qualidade das adaptações.
- Como administrador, quero configurar disciplinas e anos/séries disponíveis para os professores.

## Funcionalidades Principais

### F1 — Landing Page

| # | Requisito |
|---|-----------|
| F1.1 | Exibir hero section com proposta de valor e CTA de login. |
| F1.2 | Design moderno e minimalista, desktop-first. |

### F2 — Autenticação

| # | Requisito |
|---|-----------|
| F2.1 | Login via OAuth Google para ambos os papéis (Professor e Administrador). |
| F2.2 | O papel de Administrador é definido por flag manual no banco de dados. |
| F2.3 | Múltiplos administradores são suportados. |
| F2.4 | Usuário bloqueado pelo admin não consegue acessar o sistema após login. |

### F3 — Repositório de Provas (Professor)

| # | Requisito |
|---|-----------|
| F3.1 | Após login, exibir página de boas-vindas com lista de provas adaptadas do professor. |
| F3.2 | Cada item da lista permite acessar o resultado da adaptação (somente leitura). |
| F3.3 | Botão "Nova Adaptação" visível e acessível. |

### F4 — Nova Adaptação (Professor)

| # | Requisito |
|---|-----------|
| F4.1 | Campo de seleção de **Disciplina** (obrigatório). |
| F4.2 | Campo de seleção de **Ano/Série** (obrigatório). |
| F4.3 | Campo de texto para **Conhecimento / Tema** (opcional). |
| F4.4 | Seleção de um ou mais **Apoios** (necessidades educacionais) disponíveis. |
| F4.5 | Upload de arquivo PDF (único formato suportado, tamanho máximo de **25 MB**). |
| F4.6 | Botão "Enviar para adaptação" que inicia o processamento. |

### F5 — Processamento e Extração (Professor)

| # | Requisito |
|---|-----------|
| F5.1 | Extrair questões do PDF enviado, incluindo suporte a OCR para PDFs baseados em imagem. Em caso de falha parcial do OCR, informar o professor sobre as questões não extraídas e dar continuidade ao fluxo com as questões extraídas com sucesso. |
| F5.2 | Suportar questões objetivas (múltipla escolha) e dissertativas. |
| F5.3 | Preservar elementos visuais (tabelas, gráficos, imagens) inalterados na versão adaptada. |
| F5.4 | Após extração, exibir cada questão e solicitar ao professor que informe a(s) alternativa(s) correta(s). |
| F5.5 | Botão "Avançar" para confirmar e prosseguir para a etapa de análise/adaptação. |

### F6 — Análise e Adaptação por IA

| # | Requisito |
|---|-----------|
| F6.1 | Identificar automaticamente a(s) habilidade(s) BNCC de cada questão via agente de IA. |
| F6.2 | Identificar automaticamente o nível cognitivo Bloom de cada questão via agente de IA. |
| F6.3 | Gerar versão adaptada de cada questão para cada apoio selecionado, mantendo a habilidade BNCC. |
| F6.4 | O processamento é **assíncrono** — o professor pode sair e retornar quando estiver concluído. |
| F6.5 | Se múltiplos apoios forem selecionados, gerar uma versão adaptada por apoio, por questão. |
| F6.6 | Exibir indicador de progresso durante o processamento. |
| F6.7 | Quando a adaptação estiver pronta, exibir botão para avançar ao resultado. |

### F7 — Resultado da Adaptação (Professor)

| # | Requisito |
|---|-----------|
| F7.1 | Exibir informações gerais da prova (disciplina, ano, tema, apoios selecionados). |
| F7.2 | Para cada questão, exibir a versão adaptada com botão de copiar texto. |
| F7.3 | Para cada questão, exibir comentários com análise de habilidades BNCC. |
| F7.4 | Para cada questão, exibir comentários com análise do nível Bloom. |
| F7.5 | Para cada questão, campo de avaliação de 0 a 5 estrelas. |
| F7.6 | Para cada questão, campo de texto para comentário do professor. |
| F7.7 | Mensagem informando que os comentários ajudam a melhorar futuras adaptações. |
| F7.8 | Persistir cada avaliação/comentário do professor vinculado à questão original, questão adaptada e agente utilizado, para alimentar o fluxo de evolução de agentes (F8.8). |

### F8 — Painel Administrativo: Configurações

| # | Requisito |
|---|-----------|
| F8.1 | **Modelos:** Listar modelos cadastrados com opção de habilitar/desabilitar cada um. |
| F8.2 | **Modelos:** Criar modelo informando URL da API e API Key. |
| F8.3 | **Agentes:** Listar agentes cadastrados com opção de habilitar/desabilitar cada um. |
| F8.4 | **Agentes:** Criar agente em página dedicada (nome + prompt). |
| F8.5 | **Agentes:** Editar agente em página dedicada (nome + prompt). |
| F8.6 | **Agentes — Evoluir:** Botão "Evoluir agente" na página de edição do agente, que abre página dedicada. |
| F8.7 | **Agentes — Evoluir:** Página exibe lista de feedbacks (questão original + questão adaptada + comentário do professor) vinculados ao agente. |
| F8.8 | **Agentes — Evoluir:** O admin seleciona os feedbacks desejados e clica em "Evoluir". O sistema envia o prompt atual do agente junto com os feedbacks selecionados a uma LLM, que retorna uma sugestão de novo prompt. |
| F8.9 | **Agentes — Evoluir:** Exibir comparador lado a lado entre o prompt atual e o prompt sugerido, com comentário explicativo gerado pela LLM. |
| F8.10 | **Agentes — Evoluir:** O admin pode aceitar o prompt sugerido (substituindo o atual) ou descartar. |
| F8.11 | **Apoios:** Listar apoios cadastrados com opção de habilitar/desabilitar cada um. |
| F8.12 | **Apoios:** Criar apoio informando nome, selecionando agente e selecionando modelo. |
| F8.13 | **Disciplinas:** Listar, criar, habilitar/desabilitar disciplinas disponíveis para os professores. |
| F8.14 | **Anos/Séries:** Listar, criar, habilitar/desabilitar anos/séries disponíveis para os professores. |

### F9 — Painel Administrativo: Gestão de Usuários

| # | Requisito |
|---|-----------|
| F9.1 | Listar todos os usuários registrados no sistema. |
| F9.2 | Opção para bloquear/desbloquear o acesso de um usuário. |

## Experiência do Usuário

### Personas

- **Professor(a):** Educador(a) do ensino básico/fundamental/médio que precisa adaptar provas para alunos com necessidades específicas. Familiaridade básica com tecnologia, pouco tempo disponível.
- **Administrador(a):** Responsável técnico/pedagógico pela configuração dos modelos de IA e curadoria dos agentes/apoios.

### Fluxo Principal do Professor

1. Acessa landing page → Faz login com Google.
2. Visualiza repositório de provas → Clica em "Nova Adaptação".
3. Preenche disciplina, ano/série, tema → Seleciona apoios → Faz upload do PDF → Envia.
4. Aguarda extração → Informa alternativas corretas → Avança.
5. Processamento assíncrono (pode sair e voltar).
6. Visualiza resultado → Copia questões adaptadas → Avalia e comenta.

### Diretrizes de UI/UX

- Design moderno e minimalista, desktop-first.
- Idioma exclusivo: português brasileiro (PT-BR).
- Feedback visual claro em cada etapa do processamento.
- Ações destrutivas requerem confirmação.
- Acessibilidade: contraste adequado, navegação por teclado, textos alternativos.

## Restrições Técnicas de Alto Nível

- **Upload:** Apenas PDF; tamanho máximo de **25 MB**.
- **OCR:** Necessário para PDFs baseados em imagem (escaneados). Falhas parciais são informadas ao usuário sem interromper o fluxo.
- **LLMs externas:** Os modelos de IA são configuráveis pelo admin (URL + API Key); não há modelo fixo no código.
- **Processamento assíncrono:** A adaptação não exige que o professor permaneça na tela; ao retornar, o sistema indica visualmente o status (em andamento ou concluído). Não há notificação externa (e-mail/push) no MVP.
- **Dados:** As provas não contêm dados pessoais de alunos; conformidade com LGPD para dados do professor (nome, e-mail Google).
- **Autenticação:** OAuth 2.0 via Google.
- **Idioma:** Interface e conteúdo gerado exclusivamente em PT-BR.

## Fora de Escopo

- Layout responsivo para mobile (MVP é desktop-first apenas).
- Download de prova adaptada em PDF/DOCX formatado.
- Re-edição de adaptações já geradas (somente visualização).
- Limites de uso, planos pagos ou billing.
- Suporte a múltiplos idiomas.
- Papéis além de Professor e Administrador (ex.: coordenador, escola).
- Upload de formatos além de PDF (ex.: DOCX, imagens avulsas).
- Dados pessoais de alunos nas provas.
- Notificações externas (e-mail, push) sobre conclusão de processamento.

## Questões em Aberto

- Política de retenção/exclusão de provas e dados do professor (a definir futuramente).
