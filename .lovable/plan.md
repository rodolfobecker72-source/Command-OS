

## Atualizar Favicon para iPhone e Android

### Alterações

1. **Copiar imagem** para `public/favicon.png` (substituir o atual)
2. **Atualizar `index.html`** — adicionar tags de ícone para iOS (apple-touch-icon) e Android (manifest), além do favicon padrão:
   - `<link rel="icon" href="/favicon.png" type="image/png">`
   - `<link rel="apple-touch-icon" href="/favicon.png">`
   - `<link rel="manifest" href="/manifest.json">`
3. **Criar `public/manifest.json`** com referência ao ícone para Android/PWA

Nenhuma alteração de backend.

