
# Adicionar pagina "Sobre" ao menu

## O que sera feito

Adicionar um item "Sobre" no rodape da sidebar (abaixo de "Usuarios" ou no mesmo nivel), acessivel por todos os usuarios. Ao clicar, abre a rota `/sobre` com a logo do sistema e o texto descritivo fornecido.

## Nova pagina: Sobre

A pagina exibira:
- Logo do Command CRM (centralizada)
- Texto descritivo em 3 paragrafos, com tipografia elegante e espaçamento adequado
- Layout limpo, centralizado verticalmente

## Detalhes tecnicos

### 1. Novo arquivo: `src/pages/about/AboutPage.tsx`
- Componente simples com a logo (`command-logo.png`) e os 3 paragrafos do texto fornecido
- Estilizado com Tailwind: centralizado, max-width contido, texto em cinza escuro

### 2. Arquivo: `src/components/layout/Sidebar.tsx`
- Adicionar import do icone `Info` do lucide-react
- No rodape da sidebar (area do footer), adicionar um NavLink para `/sobre` com icone `Info` e texto "Sobre"
- Esse item aparece para **todos os usuarios**, nao apenas owners (diferente de "Usuarios")
- Reorganizar o footer para mostrar "Usuarios" (se owner) e "Sobre" (sempre)

### 3. Arquivo: `src/App.tsx`
- Adicionar import de `AboutPage`
- Adicionar rota `/sobre` dentro do `AppLayout`, sem `PageGuard` (acessivel a todos)

### 4. Arquivo: `src/config/pages.ts`
- Nao sera adicionada a `APP_PAGES` pois a pagina "Sobre" nao precisa de controle de permissao
