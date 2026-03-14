import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Plus, Package } from 'lucide-react';

interface ServiceItemRecord {
  id: string;
  name: string;
  categoryKey: string;
  defaultPrice: number;
  unit: string;
  description: string;
}

const UNIT_LABELS: Record<string, string> = {
  diaria: 'Diária',
  hora: 'Hora',
  projeto: 'Projeto',
  unidade: 'Unidade',
};

interface ServiceItemSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryKey: string;
  onSelect: (item: { description: string; unitValue: number }) => void;
}

export function ServiceItemSelector({ open, onOpenChange, categoryKey, onSelect }: ServiceItemSelectorProps) {
  const { workspace } = useAuth();
  const [items, setItems] = useState<ServiceItemRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || !workspace?.id) return;
    setSearch('');
    const load = async () => {
      const { data } = await supabase
        .from('service_items')
        .select('*')
        .eq('workspace_id', workspace.id)
        .eq('category_key', categoryKey)
        .order('name');
      setItems((data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        categoryKey: r.category_key,
        defaultPrice: Number(r.default_price),
        unit: r.unit,
        description: r.description,
      })));
      setLoaded(true);
    };
    load();
  }, [open, workspace?.id, categoryKey]);

  const filtered = useMemo(() => {
    if (!search) return items;
    return items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  const handleSelect = (item: ServiceItemRecord) => {
    onSelect({
      description: item.name + (item.description ? ` — ${item.description}` : ''),
      unitValue: item.defaultPrice,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Selecionar Item de Serviço
            <span className="service-badge service-badge-cine text-xs ml-1">{categoryKey}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {!loaded ? (
            <p className="text-center py-6 text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">
              {items.length === 0 ? 'Nenhum item cadastrado para esta categoria' : 'Nenhum item encontrado'}
            </p>
          ) : (
            filtered.map(item => (
              <button
                key={item.id}
                type="button"
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/70 transition-colors flex items-center justify-between gap-3"
                onClick={() => handleSelect(item)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm">{formatCurrency(item.defaultPrice)}</p>
                  <p className="text-xs text-muted-foreground">{UNIT_LABELS[item.unit] || item.unit}</p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
