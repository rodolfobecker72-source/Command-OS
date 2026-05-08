import { useState, useMemo } from 'react';
import { ChevronRight, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCRM } from '@/contexts/CRMContext';
import { ProjectStatusManagerDialog } from '@/components/projects/ProjectStatusManagerDialog';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';

export function ProjectManagementPage() {
  const { projectColumns, projectCards } = useCRM();
  const [manageOpen, setManageOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const sortedColumns = useMemo(
    () => [...projectColumns].sort((a, b) => a.order - b.order),
    [projectColumns]
  );

  const cardsByStatus = useMemo(() => {
    const map: Record<string, typeof projectCards> = {};
    for (const col of projectColumns) map[col.key] = [];
    for (const card of projectCards) {
      if (!map[card.status]) map[card.status] = [];
      map[card.status].push(card);
    }
    return map;
  }, [projectColumns, projectCards]);

  const toggle = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold">Gestão de Projetos</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Aqui você pode acompanhar todo fluxo de projetos da produtora, cada uma das demandas,
            responsáveis, datas, objetivo e muito mais!
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
          <Settings2 className="w-4 h-4 mr-2" />
          Gerenciar status
        </Button>
      </div>

      <div className="mt-8 space-y-1">
        {sortedColumns.map((col) => {
          const cards = cardsByStatus[col.key] || [];
          const isCollapsed = collapsed[col.key];
          return (
            <div key={col.id} className="border-b border-border/50">
              <button
                onClick={() => toggle(col.key)}
                className="w-full flex items-center gap-2 py-3 hover:bg-muted/30 transition-colors px-2 rounded-md text-left"
              >
                <ChevronRight
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    !isCollapsed && 'rotate-90'
                  )}
                />
                <span
                  className={cn(
                    'inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-sm font-medium bg-muted/50'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full', col.color)} />
                  {col.label}
                </span>
                <span className="text-xs text-muted-foreground ml-1">{cards.length}</span>
              </button>

              {!isCollapsed && (
                <div className="pl-9 pb-3 pr-2">
                  {cards.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Nenhum projeto neste status</p>
                  ) : (
                    <ul className="space-y-1">
                      {cards.map((card) => (
                        <li
                          key={card.id}
                          className="text-sm py-1.5 px-2 rounded hover:bg-muted/40 cursor-pointer"
                        >
                          <span className="font-medium">{card.projectName}</span>
                          {card.clientName && (
                            <span className="text-muted-foreground"> · {card.clientName}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ProjectStatusManagerDialog open={manageOpen} onOpenChange={setManageOpen} />
    </div>
  );
}

export default ProjectManagementPage;
