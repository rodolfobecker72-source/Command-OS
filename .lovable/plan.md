

# Renomear sistema para "Command CRM"

## Resumo

Atualizar todas as referencias ao nome do sistema de "Command 2.0" para "Command CRM" em toda a aplicacao.

## Arquivos a alterar

1. **index.html** - Titulo da aba do navegador, meta tags (og:title, description, twitter)
2. **src/pages/auth/Login.tsx** - Texto "Bem-vindo ao Command 2.0" no cabecalho do formulario
3. **src/pages/auth/Signup.tsx** - Alt text da imagem do logo
4. **src/components/layout/Sidebar.tsx** - Alt text da imagem do logo
5. **src/components/layout/Header.tsx** - Nenhuma alteracao necessaria (nao referencia o nome)

## Detalhes tecnicos

Substituicoes de texto:
- `"Command 2.0"` → `"Command CRM"` em titulos, alt texts e meta tags
- A descricao "Sistema interno de gestao da produtora." permanece inalterada
- Os arquivos de imagem do logo (`command-logo.png`) nao precisam ser alterados, apenas os textos

