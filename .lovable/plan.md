## Diagnóstico

O erro `ERR_BLOCKED_BY_RESPONSE` na tela `accounts.google.com/signin/oauth/error` acontece **depois** de você escolher a conta. Isso não é problema das credenciais do OAuth (elas funcionaram — a tela de escolher conta abriu). É o Google recusando continuar o fluxo porque a janela foi aberta **a partir do iframe de preview do Lovable**.

O Google usa cabeçalhos `Cross-Origin-Opener-Policy` / `X-Frame-Options` para bloquear qualquer fluxo OAuth que esteja associado a um contexto embutido (iframe). Como hoje o `GoogleCalendarConnect` faz:

```ts
window.open(data.url, 'google-oauth', 'width=520,height=640');
```

…o popup herda o "opener" do iframe do preview, e após selecionar a conta o Google bloqueia (`ERR_BLOCKED_BY_RESPONSE`).

## O que corrigir

Ajustar `src/components/profile/GoogleCalendarConnect.tsx` para abrir o OAuth em uma **aba de nível superior**, sem opener, em vez de um popup filho do iframe:

1. Trocar `window.open(url, 'google-oauth', 'width=…,height=…')` por `window.open(url, '_blank', 'noopener,noreferrer')`.
   - Sem opener a nova aba fica desacoplada do iframe do preview e o Google aceita renderizar o consent.
2. Se `window.open` retornar `null` (bloqueio de popup), cair para `window.top.location.href = url` (navega a página inteira em vez de só o iframe) como fallback.
3. Após o OAuth terminar, o callback já redireciona para o app com `?google_calendar=connected` — o `useEffect` de `focus` continua funcionando para recarregar o status quando o usuário volta.

Também vou reforçar a mensagem para o usuário: se ele estiver testando **dentro do editor Lovable**, avisar que o fluxo do Google funciona melhor no preview em nova aba ou na URL publicada (`https://command.hero.rec.br` ou `https://herocommandcrm.lovable.app`).

## Fora do escopo (só se der ruim depois)

- Não vou alterar as Edge Functions — o OAuth start/callback estão funcionando (a tela do Google abriu).
- Não vou mexer no `redirect_uri` (continua apontando para `…/functions/v1/google-calendar-oauth-callback`), pois o próprio erro mostra que o Google chegou até a etapa pós-escolha de conta.

## Como validar

1. Você clica em **Conectar Google Calendar** dentro do Perfil.
2. Abre uma **nova aba** com a tela do Google.
3. Escolhe a conta → aceita permissões → é redirecionado para o callback.
4. O callback fecha/redireciona e ao voltar ao Perfil aparece o e-mail conectado.

Se ainda der `ERR_BLOCKED_BY_RESPONSE`, teste direto na URL publicada — o preview em iframe pode ter restrições adicionais em alguns navegadores (Safari com bloqueio de cookies de terceiros).