> Seu parceiro financeiro — organize renda, gastos e informações fiscais com uma interface pensada para ser **acessível a todas as pessoas**.

O **Money Buddy** é uma aplicação web que ajuda jovens adultos a cuidar das próprias finanças: acompanhar receitas, categorizar despesas, entender obrigações fiscais e aprender conceitos de educação financeira, com foco em **acessibilidade** e **privacidade dos dados**. O mascote do app é o Buddy, uma capivara.

## Funcionalidades

- **Visão geral** – resumo das finanças com métricas e gráfico de gastos por categoria.
- **Minha carteira** – panorama de contas e movimentações.
- **Gastos** – painel de despesas por categoria (Moradia, Alimentação, Transporte, Saúde e bem-estar, Lazer e outros), com orçamento por categoria, barras de progresso e cadastro de novas despesas.
- **Calendário fiscal** – prazos e informações de impostos, com detalhes em janelas explicativas (por exemplo, como declarar renda extra).
- **Aprender** – conteúdos curtos de educação financeira.
- **Privacidade** – explicações sobre como os dados são tratados.

### Acessibilidade

A tela de boas-vindas e o painel de preferências permitem personalizar a experiência:

- Tamanho da fonte (Padrão, Grande, Muito grande), família da fonte (Manrope, Arial, Georgia), altura de linha e zoom da página
- Temas **Claro**, **Escuro**, **Alto contraste** e **Personalizado** (cores de fundo e texto), além de inversão de cores
- Cor de destaque para trechos marcados pela pessoa durante a leitura
- Redução de movimento e controles maiores
- Leitura em voz alta (síntese de voz em pt-BR), alertas sonoros e vibração
- Tradução para **Libras** via widget [VLibras](https://vlibras.gov.br/)
- Atalhos de teclado
- Navegação por teclado com foco preso nos diálogos, mensagens anunciadas a leitores de tela (`aria-live`) e imagem com zoom por botões ou gesto de pinça

> ⚠️ **Dados de demonstração:** os valores de gastos e carteira são fictícios, definidos no código, e **não são salvos** — ao recarregar a página, o estado volta ao inicial. Nenhum dado é enviado a servidores.

## Tecnologias

| Camada | Ferramenta |
| --- | --- |
| Interface | React 19 + TypeScript 5.7 |
| Build / dev server | Vite 8 |
| Estilos | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Formatação | oxfmt |
| Gerenciador de pacotes | pnpm 10 |
| Ambiente | Node.js 22 (gerenciado com [mise](https://mise.jdx.dev/)) |

O projeto foi gerado no **Figma Make**, por isso a configuração do Vite inclui plugins auxiliares do Figma (`.figma/make/`).

## Pré-requisitos

- **Node.js 22** e **pnpm 10.34.3**
- (Opcional) [mise](https://mise.jdx.dev/) para instalar as versões corretas automaticamente
- [Git LFS](https://git-lfs.com/) — o `.gitattributes` do repositório rastreia imagens e outros arquivos binários com LFS

## Como executar

A forma mais simples de executar o app é acessando o link do figma : https://close-merry-99467925.figma.site
Mas caso queira executar o programa usando o repositório pode seguir o passo a passo abaixo.

```bash
# 1. Clone o repositório (com Git LFS instalado)
git clone <URL-DO-REPOSITORIO>
cd <NOME-DO-REPOSITORIO>

# 2. Instale as versões de Node e pnpm definidas em .mise.toml
mise install
# Sem mise: instale Node 22 e rode `npm install -g pnpm@10.34.3`

# 3. Instale as dependências
pnpm install

# 4. Inicie o servidor de desenvolvimento
pnpm dev
```

Abra **http://localhost:8443** no navegador. A porta padrão é `8443`; para mudar, defina a variável `PORT`:

```bash
PORT=3000 pnpm dev
```

### Scripts disponíveis

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Inicia o servidor de desenvolvimento com hot reload |
| `pnpm build` | Gera a versão de produção na pasta `dist/` |
| `pnpm preview` | Serve localmente o build de produção |
| `pnpm format` | Formata o código com oxfmt |

## Estrutura do projeto

```text
.
├── .figma/make/
│   ├── dev.json          # Arquivos que disparam reinstalação / reinício do servidor
│   ├── site.json         # Título, descrição e opções de acessibilidade do site
│   ├── install           # Script de instalação (pnpm install)
│   ├── format            # Script de formatação
│   └── langserver        # Language server TypeScript (vtsls)
├── src/
│   ├── assets/           # Imagens (mascote do Buddy)
│   ├── components/
│   │   └── Accessibility.tsx   # Feedback (voz, som, vibração), foco em diálogos, zoom de imagem
│   ├── App.tsx           # Componente principal: navegação, gastos, modais e preferências
│   ├── index.css         # Tailwind v4, tema de cores e estilos de acessibilidade
│   ├── main.tsx          # Ponto de entrada React
│   └── vite-env.d.ts
├── .gitattributes        # Regras do Git LFS
├── .gitignore
├── .mise.toml            # Versões de Node e pnpm
├── AGENTS.md / CLAUDE.md # Instruções para agentes de IA
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vite.config.ts
```

## Observações

- O `vite.config.ts` lê `./.figma/make/site.json`; se esse arquivo estiver ausente, o servidor não inicia.
- As fontes (Google Fonts) e o widget VLibras são carregados da internet, então algumas funcionalidades visuais e de Libras exigem conexão.
