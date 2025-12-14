# 🛒 Loja Online E-commerce

Este projeto é uma plataforma completa de comércio eletrônico desenvolvida com uma arquitetura moderna e escalável, utilizando **Monorepo** para gerenciar o Frontend e Backend. A aplicação conecta Vendedores e Clientes, oferecendo fluxos distintos e personalizados para cada perfil.

---

## 🚀 Tecnologias e Arquitetura

O projeto segue uma arquitetura baseada em microsserviços/monorepo gerenciada pelo **TurboRepo**.

### 🛠 Stack Tecnológica

*   **Linguagem**: [TypeScript](https://www.typescriptlang.org/) (Frontend e Backend)
*   **Monorepo Manager**: [TurboRepo](https://turbo.build/)
*   **Backend (API)**: [NestJS](https://nestjs.com/)
    *   Arquitetura modular.
    *   Autenticação via JWT.
    *   ORM: [Prisma](https://www.prisma.io/) com PostgreSQL.
*   **Frontend (Web)**: [Next.js 14+](https://nextjs.org/) (App Router)
    *   Estilização: [TailwindCSS](https://tailwindcss.com/).
    *   Design Responsivo.
    *   Componentes React modernos.

### 📂 Estrutura de Diretórios

*   `apps/`
    *   `api`: Servidor Backend (NestJS). Responsável por toda a regra de negócio, autenticação, gestão de produtos e pedidos.
    *   `web`: Aplicação Frontend (Next.js). Interface do usuário para Clientes e Vendedores.
*   `packages/`
    *   `database`: Pacote compartilhado contendo o Schema do Prisma e configurações de banco de dados.

---

## 🔑 Acesso e Usuários de Teste

> **⚠️ AVISO IMPORTANTE: Limitação de Cadastro**
>
> Atualmente, o sistema de envio de e-mails (SMTP) **não está ativo** em ambiente de desenvolvimento local.
> O fluxo de cadastro de novos usuários exige a validação de um código MFA enviado por e-mail.
> **Portanto, não é possível registrar novos usuários pelo Frontend** sem acesso ao banco de dados para recuperar o código manualmente.
>
> **Utilize as credenciais abaixo para testar todas as funcionalidades:**

### 👤 Cliente (Comprador)
*   **Email**: `teste@gmail.com`
*   **Senha**: `123456`
*   **Usuário**: teste

### 🏪 Vendedor (Lojista)
*   **Email**: `vendedor@gmail.com`
*   **Senha**: `123456`
*   **Usuário**: vendedor

---

## 📦 Funcionalidades Detalhadas

### 1. Autenticação e Gestão de Conta
O sistema suporta dois papéis distintos com fluxos de vida separados:

*   **Login Unificado**: O sistema identifica automaticamente o papel do usuário (Cliente ou Vendedor).
*   **Exclusão de Conta (Cliente)**:
    *   O cliente pode excluir sua conta permanentemente.
    *   **Histórico Preservado**: Por questões de auditoria, os registros de compras realizadas são mantidos no banco de dados, mas os dados pessoais são removidos/anonimizados.
*   **Desativação de Loja (Vendedor)**:
    *   Para garantir a integridade dos dados de vendas passadas, vendedores não excluem contas, apenas as **desativam**.
    *   Ao desativar, todos os produtos daquele vendedor são automaticamente **ocultados** da loja pública.

### 2. Painel do Vendedor
O vendedor possui um Dashboard exclusivo para gestão do sew negócio:

*   **Dashboard Analítico**:
    *   Visualização clara do **Faturamento Total**.
    *   Contador de **Produtos Vendidos** e **Produtos Cadastrados**.
    *   Destaque para o **Produto Mais Vendido**.
*   **Gestão de Produtos**:
    *   **Cadastro Manual**: Formulário completo com upload de múltiplas imagens, definição de categoria, preço e estoque.
    *   **Importação em Massa (CSV)**: Ferramenta para upload de planilhas CSV para cadastro rápido de grandes volumes de produtos. Processamento otimizado para performance.
    *   **Edição e Remoção**: Capacidade de atualizar detalhes ou remover produtos do catálogo.

### 3. Experiência do Cliente (Loja)
A interface de compra foi desenhada para facilitar a descoberta e aquisição de produtos:

*   **Catálogo e Busca**:
    *   Filtragem eficiente de produtos direto no Back-end.
    *   Listagem paginada para otimizar o carregamento.
    *   Página de detalhes do produto com fotos, descrição e informações do vendedor.
*   **Interações**:
    *   **Favoritos**: O usuário pode salvar produtos em sua lista de desejos.
    *   **Carrinho Persistente**: Os itens adicionados ao carrinho são salvos no banco de dados, permitindo que o usuário retome a compra de qualquer dispositivo.
*   **Checkout**:
    *   Fluxo de finalização de compra simples e direto.
    *   Geração automática de registro no **Histórico de Compras**.
    *   Redirecionamento inteligente: Se um usuário não logado tentar comprar, adicionar ao carrinho ou favoritar, ele é redirecionado para o Login.

---

## 🛠 Como Rodar o Projeto

1.  **Instalar Dependências**:
    ```bash
    npm install
    ```

2.  **Configurar Banco de Dados**:
    Certifique-se de ter um container Postgres rodando (veja `docker-compose.yml`) e execute as migrações:
    ```bash
    npx prisma migrate dev
    ```

3.  **Iniciar Aplicação**:
    Na raiz do projeto, execute:
    ```bash
    npm run dev
    ```
    Isso iniciará tanto o **Frontend** (port 3000) quanto o **Backend** (port 3333).

---
*Desenvolvido com foco em performance, segurança e experiência do usuário.*
