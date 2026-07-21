import { useMemo, useState } from 'react';
import { ExternalLink, Search, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { HISTORICAL_PROJECTS } from '@/data/historicalProjects';

export function ProjectHistoryPage() {
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = HISTORICAL_PROJECTS.filter(
      (p) => !q || p.name.toLowerCase().includes(q) || p.year.toLowerCase().includes(q)
    );
    const byYear = new Map<string, typeof HISTORICAL_PROJECTS>();
    for (const p of filtered) {
      if (!byYear.has(p.year)) byYear.set(p.year, []);
      byYear.get(p.year)!.push(p);
    }
    // sort each group ascending by id
    for (const arr of byYear.values()) arr.sort((a, b) => a.id - b.id);

    // year ordering: numeric years desc, then others alpha
    const entries = Array.from(byYear.entries());
    entries.sort(([a], [b]) => {
      const na = /^\d{4}$/.test(a) ? parseInt(a) : null;
      const nb = /^\d{4}$/.test(b) ? parseInt(b) : null;
      if (na && nb) return nb - na;
      if (na) return -1;
      if (nb) return 1;
      return a.localeCompare(b, 'pt-BR');
    });
    return entries;
  }, [query]);

  const isValidLink = (l: string) => l && l !== '-' && /^https?:\/\//i.test(l);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Histórico de Projetos</h1>
          <p className="text-sm text-muted-foreground">
            Arquivo de projetos anteriores importados do Notion
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar projeto ou ano..."
          className="pl-9"
        />
      </div>

      {grouped.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum projeto encontrado.</p>
      )}

      {grouped.map(([year, projects]) => (
        <section key={year} className="space-y-3">
          <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
            <h2 className="text-lg font-semibold">{year}</h2>
            <Badge variant="secondary">{projects.length}</Badge>
          </div>
          <div className="border rounded-lg divide-y overflow-hidden">
            {projects.map((p) => (
              <div
                key={`${p.year}-${p.id}-${p.name}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors"
              >
                <span className="text-xs font-mono text-muted-foreground w-12 shrink-0 tabular-nums">
                  #{p.id}
                </span>
                <span className="flex-1 text-sm truncate">{p.name}</span>
                {isValidLink(p.link) ? (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    Acessar material <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">Sem link</span>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default ProjectHistoryPage;
