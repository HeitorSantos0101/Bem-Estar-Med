# Bem-Estar Med — Sistema de Gestão

Aplicação web em HTML, CSS e JavaScript puro para loja de artigos médicos/hospitalares.

## Funcionalidades implementadas

- Login por perfil:
  - admin (`admin/admin123`)
  - funcionário (`funcionario/func123`)
- Abas horizontais:
  - Estoque
  - Aluguéis
  - Vendas
  - Relatórios
- Cada produto é único:
  - 1 código = 1 item
  - sem campo de quantidade
  - status do item: Disponível / Alugado / Vendido
- Aluguéis com:
  - campo CNPJ opcional
  - renovação de aluguel
  - edição de aluguel
  - devolução
- Vendas com:
  - edição de venda
- Relatórios com:
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
