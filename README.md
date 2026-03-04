# Bem-Estar Med — Sistema de Gestão

Aplicação web em HTML, CSS e JavaScript puro para loja de artigos médicos/hospitalares.

## Fluxo de usuários (novo)

- Primeiro acesso:
  - o sistema pede criação do usuário **admin** (nome + senha).
- Próximos acessos:
  - login com **nome**, **senha** e **perfil** (admin/funcionário).
- Regras:
  - só existe **1 admin** inicial;
  - admin pode criar outros usuários apenas como **funcionário**;
  - admin pode **alterar senha** de qualquer usuário;
  - funcionário **não pode excluir** produtos.

## Funcionalidades implementadas

- Abas horizontais:
  - Estoque
  - Aluguéis
  - Vendas
  - Relatórios
  - Usuários
- Cada produto é único:
  - 1 código = 1 item
  - sem campo de quantidade
  - status: Disponível / Alugado / Vendido
- Aluguéis:
  - campo CNPJ opcional
  - renovação, edição e devolução
- Vendas:
  - edição de venda
- Relatórios:
  - setas para trocar mês
  - resumo mensal de vendas e aluguéis
  - exportação CSV/PDF
- Código de barras CODE128 com impressão de etiqueta.
- Compatível com celular (layout responsivo).

## Como executar

1. Abra no VS Code.
2. Rode um servidor local:
   - `python3 -m http.server 5500`
3. Acesse:
   - `http://localhost:5500`
