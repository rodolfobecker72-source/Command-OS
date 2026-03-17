

## Substituir imagem de fundo por gradiente CSS

### Contexto
A imagem atual já exibe um gradiente azul escuro/azul royal. Substituir por CSS puro elimina completamente o tempo de carregamento.

### Alterações

**1. `src/pages/MaintenancePage.tsx`**
- Remover `import loginBg`
- Trocar `style={{ backgroundImage: url(...) }}` por um gradiente CSS que replica o visual atual:
```css
background: radial-gradient(ellipse at 30% 50%, #1a237e 0%, #0a1045 40%, #060d2e 100%);
```

**2. `src/pages/auth/Login.tsx`**
- Mesma alteração: remover import e usar gradiente CSS

**3. Limpeza (opcional)**
- O arquivo `src/assets/login-bg.jpg` pode ser removido, já que não será mais usado

Resultado: fundo carrega instantaneamente, zero dependência de imagem.

