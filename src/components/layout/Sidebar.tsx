import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  LayoutGrid,
  UserCog,
  Layers,
  ChevronDown,
  Briefcase,
  Target,
  Info,
  Package } from
'lucide-react';
import commandLogo from '@/assets/command-logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { APP_PAGES } from '@/config/pages';

interface NavGroup {
  label: string;
  icon: typeof Users;
  items: {
    name: string;
    href: string;
    icon: typeof Users;
    pageKey: string; // key from APP_PAGES for permission check
  }[];
}

const navGroups: NavGroup[] = [
{
  label: 'Comercial',
  icon: Briefcase,
  items: [
  { name: 'Prospecção', href: '/prospeccao', icon: Target, pageKey: 'prospeccao' },
  { name: 'Clientes', href: '/clientes', icon: Users, pageKey: 'clientes' },
  { name: 'CRM', href: '/crm', icon: LayoutGrid, pageKey: 'crm' },
  { name: 'Categorias de Serviço', href: '/categorias', icon: Layers, pageKey: 'categorias' },
  { name: 'Itens de Serviço', href: '/itens-servico', icon: Package, pageKey: 'itens-servico' }]

}];


export function Sidebar() {
  const location = useLocation();
  const { hasPageAccess } = useAuth();

  const isParentActive = (href: string) => location.pathname.startsWith(href);

  // Filter nav groups based on user permissions
  const filteredNavGroups = navGroups.
  map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPageAccess(item.pageKey))
  })).
  filter((group) => group.items.length > 0);

  // Determine which groups should be open by default (based on active route)
  const getDefaultOpen = () => {
    const open: Record<string, boolean> = {};
    filteredNavGroups.forEach((group) => {
      open[group.label] = group.items.some((item) => isParentActive(item.href));
    });
    // If nothing is active, open the first group
    if (!Object.values(open).some(Boolean) && filteredNavGroups.length > 0) {
      open[filteredNavGroups[0].label] = true;
    }
    return open;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getDefaultOpen);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const { role } = useAuth();
  const showUsuarios = role === 'owner';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={commandLogo} alt="Command CRM" className="h-14 w-auto" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pt-6 space-y-4 overflow-y-auto scrollbar-thin">
        {filteredNavGroups.map((group) =>
        <div key={group.label}>
            {/* Group Header */}
            <button
            onClick={() => toggleGroup(group.label)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors rounded-lg">

              <div className="flex items-center gap-2">
                <group.icon className="w-4 h-4" />
                <span>{group.label}</span>
              </div>
              <motion.div
              animate={{ rotate: openGroups[group.label] ? 180 : 0 }}
              transition={{ duration: 0.2 }}>

                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </button>

            {/* Group Items */}
            <AnimatePresence initial={false}>
              {openGroups[group.label] &&
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden">

                  <div className="mt-1 space-y-0.5 pl-2">
                    {group.items.map((item) =>
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`nav-link ${isParentActive(item.href) ? 'active' : ''}`}>

                        <item.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </NavLink>
                )}
                  </div>
                </motion.div>
            }
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border space-y-1">
        {showUsuarios &&
          <NavLink
            to="/usuarios"
            className={`nav-link w-full ${location.pathname === '/usuarios' ? 'active' : ''}`}>
            <UserCog className="w-5 h-5" />
            <span className="text-sm font-medium">Usuários</span>
          </NavLink>
        }
        <NavLink
          to="/sobre"
          className={`nav-link w-full ${location.pathname === '/sobre' ? 'active' : ''}`}>
          <Info className="w-5 h-5" />
          <span className="text-sm font-medium">Sobre</span>
        </NavLink>
      </div>
    </aside>);

}