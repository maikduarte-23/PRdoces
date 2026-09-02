<div align="center">

# 🧁 P.R. Doces — Sistema de Gestão para Confeitaria Artesanal

**Uma plataforma moderna, completa e inteligente para o gerenciamento de ateliês de confeitaria e docerias.**

[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📌 Sobre o Projeto

O **P.R. Doces** é um sistema de gestão sob medida desenvolvido para automatizar e profissionalizar todas as etapas operacionais de uma confeitaria artesanal: desde o atendimento ao cliente, precificação e orçamentos visuais, até o controle minucioso da produção diária, estoque de insumos e saúde financeira do negócio.

---

## ✨ Funcionalidades Principais

| Módulo | Descrição |
| :--- | :--- |
| 📊 **Dashboard Geral** | Visão panorâmica do negócio em tempo real: faturamento, pedidos pendentes, entregas do dia e gráficos de desempenho. |
| 📋 **Orçamentos Inteligentes** | Cálculo automatizado de custos de ingredientes e mão de obra, precificação ágil e geração de orçamentos visuais em formato de imagem (prontos para envio no WhatsApp). |
| 📅 **Agenda de Produção** | Calendário interativo para controle de entregas por data/horário com alerta e bloqueio de capacidade máxima diária (`daily_limits`). |
| 🍰 **Catálogo Digital** | Vitrine de produtos com fotos, descrições e valores personalizáveis para divulgação nas redes sociais. |
| 📦 **Controle de Estoque** | Cadastro de insumos e matérias-primas, cálculo de custo unitário, histórico de movimentações e alertas de estoque baixo. |
| 👥 **Gestão de Clientes (CRM)** | Histórico completo de encomendas, preferências do cliente, contatos e aniversários. |
| 💰 **Módulo Financeiro** | Fluxo de caixa com entradas e saídas, controle de recebimentos (Sinal vs Restante), formas de pagamento e relatórios analíticos com gráficos. |
| 🔒 **Segurança & Logs** | Tela de login segura com proteção contra tentativas excessivas (lockout automático), logs de auditoria e controle de acessos. |

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Estilização:** Tailwind CSS
- **Animações e Ícones:** Framer Motion (`motion/react`) & Lucide React
- **Gráficos e Relatórios:** Recharts
- **Exportação Visual:** HTML2Canvas (geração de imagens de orçamentos)
- **Notificações:** React Hot Toast

### Backend & Banco de Dados
- **Servidor:** Node.js + Express + TypeScript
- **Driver de Banco:** `pg` (node-postgres)
- **Banco de Dados Relacional:** PostgreSQL 16

### Infraestrutura & DevOps
- **Conteinerização:** Docker & Docker Compose
- **Acesso Remoto:** Suporte integrado a rede segura Tailscale VPN

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados **OU**
- [Node.js](https://nodejs.org/) (versão 18+) e [PostgreSQL 16](https://www.postgresql.org/)

---

### Opção 1: Executando com Docker Compose (Recomendado)

1. **Clone o repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd PRdoces
   ```

2. **Configure as variáveis de ambiente:**
   Crie ou edite o arquivo `.env` na raiz do projeto (ou utilize o arquivo existente):
   ```env
   POSTGRES_USER=admin
   POSTGRES_PASSWORD=admin
   POSTGRES_DB=pr_doces
   # Opcional (Tailscale VPN):
   TS_AUTHKEY=
   ```

3. **Inicie os containers:**
   ```bash
   docker-compose up -d --build
   ```

4. **Acesse as aplicações:**
   - 🌐 **Frontend:** [http://localhost:3050](http://localhost:3050)
   - ⚙️ **Backend API:** [http://localhost:4000](http://localhost:4000)
   - 🗄️ **PostgreSQL:** `localhost:5434` (Usuário: `admin`, Senha: `admin`, Banco: `pr_doces`)

---

### Opção 2: Executando Localmente (Desenvolvimento)

#### 1. Banco de Dados
Certifique-se de ter uma instância do PostgreSQL rodando e crie o banco `pr_doces`. Em seguida, execute o script de inicialização `init.sql`.

#### 2. Backend
```bash
cd backend
npm install
npm run dev
```
*O servidor iniciará na porta `4000`.*

#### 3. Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
*Acesse o frontend no endereço exibido no terminal (geralmente [http://localhost:3000](http://localhost:3000) ou [http://localhost:5173](http://localhost:5173)).*

---

## 📁 Estrutura do Projeto

```plaintext
PRdoces/
├── backend/               # API REST em Node.js com TypeScript
│   ├── src/
│   │   └── server.ts      # Rotas, controladores e conexão com PostgreSQL
│   ├── Dockerfile
│   └── package.json
│
├── frontend/              # Interface SPA em React + Vite + Tailwind
│   ├── src/
│   │   ├── components/    # Módulos do sistema (Dashboard, Budget, Finance, etc.)
│   │   │   └── forms/     # Modais e formulários reutilizáveis
│   │   ├── context/       # Provedores de estado global (AppContext)
│   │   ├── services/      # Integrações com a API REST
│   │   ├── types.ts       # Definições de tipagem TypeScript
│   │   └── main.tsx       # Ponto de entrada da aplicação
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml     # Orquestração de containers (Frontend, Backend, DB, Tailscale)
├── init.sql               # Estrutura inicial do banco de dados (tabelas e constraints)
├── analise.md             # Documento de roadmap e análise técnica
└── README.md              # Documentação principal
```

---

## 🔒 Acesso e Autenticação

Ao acessar o sistema pela primeira vez, utilize a chave de acesso ou credenciais administrativas configuradas no painel de login. O sistema conta com proteção de segurança com limitação progressiva de tentativas de acesso.

---

## 📄 Licença

Este projeto é desenvolvido para uso e gestão interna da confeitaria **P.R. Doces**. Todos os direitos reservados.
