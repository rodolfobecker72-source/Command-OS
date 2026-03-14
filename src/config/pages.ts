// Centralized registry of all pages in the system
// When adding new pages, add them here and they'll appear in user permissions

export interface AppPage {
  key: string;      // Unique key for permission storage
  label: string;    // Display name
  href: string;     // Route path
  group: string;    // Navigation group name
}

export const APP_PAGES: AppPage[] = [
  // Comercial
  { key: 'prospeccao', label: 'Prospecção', href: '/prospeccao', group: 'Comercial' },
  { key: 'clientes', label: 'Clientes', href: '/clientes', group: 'Comercial' },
  { key: 'crm', label: 'CRM', href: '/crm', group: 'Comercial' },
  { key: 'categorias', label: 'Categorias de Serviço', href: '/categorias', group: 'Comercial' },
  { key: 'itens-servico', label: 'Itens de Serviço', href: '/itens-servico', group: 'Comercial' },
  { key: 'regras-comerciais', label: 'Regras Comerciais', href: '/configuracoes/regras-comerciais', group: 'Configurações' },
  
  // Sistema
  { key: 'usuarios', label: 'Usuários', href: '/usuarios', group: 'Sistema' },
];

// Get all page keys (useful for setting "all access" by default)
export function getAllPageKeys(): string[] {
  return APP_PAGES.map(p => p.key);
}

// Group pages by their group name for display
export function getPagesByGroup(): Record<string, AppPage[]> {
  return APP_PAGES.reduce((acc, page) => {
    if (!acc[page.group]) acc[page.group] = [];
    acc[page.group].push(page);
    return acc;
  }, {} as Record<string, AppPage[]>);
}
