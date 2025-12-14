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
    *   **Banco de Dados**: [PostgreSQL](https://www.postgresql.org/)
        *   Utilizado para persistência robusta de dados de usuários, produtos e pedidos.
        *   Gerenciado pelo ORM **Prisma**.
*   **Frontend (Web)**: [Next.js 14+](https://nextjs.org/) (App Router)
    *   Estilização: [TailwindCSS](https://tailwindcss.com/).
    *   Design Responsivo.
    *   Componentes React modernos.

### ☁️ Simulação de Nuvem Local (LocalStack)
Para garantir um ambiente de desenvolvimento idêntico ao de produção sem custos de nuvem, utilizamos o **LocalStack**:
*   **S3 (Simple Storage Service)**: Simulado localmente para o upload e armazenamento de imagens dos produtos.
*   **AWS SDK**: A aplicação utiliza o SDK oficial da AWS, tornando a migração para a nuvem real (AWS) transparente, bastando alterar as variáveis de ambiente.

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

### 👤 Cliente (Comprador)
*   **Email**: `teste2@gmail.com`
*   **Senha**: `123456`
*   **Usuário**: teste2
---

## 📦 Funcionalidades Detalhadas

### 1. Autenticação e Gestão de Conta
O sistema suporta dois papéis distintos com fluxos de vida separados:

*   **Login Unificado**: O sistema identifica automaticamente o papel do usuário (Cliente ou Vendedor).
*   **Exclusão de Conta (Cliente)**:
    *   O cliente pode excluir sua conta permanentemente.
    *   **Histórico Preservado**: Por questões de auditoria, os registros de compras realizadas são mantidos no banco de dados (PostgreSQL), mas os dados pessoais são removidos/anonimizados.
*   **Desativação de Loja (Vendedor)**:
    *   Para garantir a integridade dos dados de vendas passadas, vendedores não excluem contas, apenas as **desativam**.
    *   Ao desativar, todos os produtos daquele vendedor são automaticamente **ocultados** da loja pública.

### 2. Painel do Vendedor
O vendedor possui um Dashboard exclusivo para gestão do negócio:

*   **Dashboard Analítico**:
    *   Visualização clara do **Faturamento Total**.
    *   Contador de **Produtos Vendidos** e **Produtos Cadastrados**.
    *   Destaque para o **Produto Mais Vendido**.
*   **Gestão de Produtos**:
    *   **Cadastro Manual**: Formulário completo com upload de múltiplas imagens (armazenadas no S3/LocalStack), definição de categoria, preço e estoque.
    *   **Importação em Massa (CSV)**: Ferramenta para upload de planilhas CSV para cadastro rápido de grandes volumes de produtos.
    *   **Edição e Remoção**: Capacidade de atualizar detalhes ou remover produtos do catálogo.

### 3. Experiência do Cliente (Loja)
A interface de compra foi desenhada para facilitar a descoberta e aquisição de produtos:

*   **Catálogo e Busca**:
    *   Filtragem eficiente de produtos direto no Back-end com queries otimizadas no PostgreSQL.
    *   Listagem paginada para otimizar o carregamento.
*   **Interações**:
    *   **Favoritos**: O usuário pode salvar produtos em sua lista de desejos.
    *   **Carrinho Persistente**: Os itens adicionados ao carrinho são salvos no banco de dados.
*   **Checkout**:
    *   Fluxo de finalização de compra simples e direto.
    *   Geração automática de registro no **Histórico de Compras**.
    *   **Redirecionamento Inteligente**: Se um usuário não logado tentar comprar, adicionar ao carrinho ou favoritar, ele é redirecionado para o Login.

---

## 🛠 Como Rodar o Projeto

1.  **Instalar Dependências**:
    ```bash
    npm install
    ```

2.  **Configurar Banco de Dados e Serviços**:
    Certifique-se de ter os containers **Postgres** e **LocalStack** rodando (veja `docker-compose.yml`) e execute as migrações:
    ```bash
    npx prisma migrate dev
    ```

3.  **Iniciar Aplicação**:
    Na raiz do projeto (`loja-online`), execute:
    ```bash
    npm run dev
    ```
    Isso iniciará tanto o **Frontend** (port 3000) quanto o **Backend** (port 3333).

---
*Desenvolvido com foco em performance, segurança e experiência do usuário.*
