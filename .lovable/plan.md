

# Listas de seleção não aparecem dentro do Dialog de Lead

## Problema

O componente `Select` (Radix UI) usa um `Portal` para renderizar o dropdown. O `Dialog` também usa um `Portal`. Ambos têm `z-index: 50`. Dependendo do navegador/sistema operacional, o dropdown do Select pode renderizar **atrás** do overlay do Dialog, tornando as opções invisíveis.

Isso explica por que funciona em um computador e não em outro — o comportamento de stacking context de Portals pode variar entre navegadores/versões.

## Solução

Aumentar o `z-index` do `SelectContent` de `z-50` para `z-[200]` no componente base `src/components/ui/select.tsx`. Isso garante que o dropdown sempre aparece acima de qualquer Dialog.

### Arquivo: `src/components/ui/select.tsx`

Na classe do `SelectPrimitive.Content` (linha ~72), trocar `z-50` por `z-[200]`.

Essa é uma alteração de 1 linha no componente base que corrige o problema em todos os lugares que usam Select dentro de Dialogs.

