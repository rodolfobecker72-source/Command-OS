import { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCRM } from '@/contexts/CRMContext';
import { formatCurrency } from '@/types/crm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import { SortableTableBody } from '@/components/crm/SortableTableBody';
import { TableCell as TC } from '@/components/ui/table';
import { toast } from 'sonner';

export interface ServiceItemRecord {
  id: string;
  name: string;
  categoryKey: string;
  defaultPrice: number;
  unit: string;
  description: string;
  createdAt: Date;
}

const UNIT_LABELS: Record<string, string> = {
  diaria: 'Diária',
  hora: 'Hora',
  projeto: 'Projeto',
  unidade: 'Unidade',
};

const UNIT_OPTIONS = Object.entries(UNIT_LABELS).map(([value, label]) => ({ value, label }));

const SPECIAL_CATEGORIES = [
  { key: 'universal', label: 'Universal (todos os serviços)', order: 9990 },
  { key: 'despesas_operacionais', label: 'Despesas Operacionais', order: 9991 },
];

function itemFromDb(row: any): ServiceItemRecord {
  return {
    id: row.id,
    name: row.name,
    categoryKey: row.category_key,
    defaultPrice: Number(row.default_price),
    unit: row.unit,
    description: row.description,
    createdAt: new Date(row.created_at),
  };
}

export function ServiceItemsPage() {
  const { workspace } = useAuth();
  const { serviceCategories } = useCRM();
  const workspaceId = workspace?.id;

  const [items, setItems] = useState<ServiceItemRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItemRecord | null>(null);
  const [form, setForm] = useState({ name: '', categoryKey: '', defaultPrice: 0, unit: 'diaria', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  const loadItems = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('service_items')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name');
    if (error) {
      toast.error('Erro ao carregar itens de serviço');
      console.error(error);
    }
    setItems((data || []).map(itemFromDb));
    setIsLoading(false);
  }, [workspaceId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const allCategories = useMemo(() => {
    return [...serviceCategories, ...SPECIAL_CATEGORIES].sort((a, b) => a.order - b.order);
  }, [serviceCategories]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.categoryKey === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, filterCategory]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, ServiceItemRecord[]> = {};
    for (const item of filteredItems) {
      if (!groups[item.categoryKey]) groups[item.categoryKey] = [];
      groups[item.categoryKey].push(item);
    }
    return allCategories
      .filter(cat => groups[cat.key])
      .map(cat => ({ category: cat, items: groups[cat.key] }));
  }, [filteredItems, allCategories]);

  const openNew = () => {
    setEditingItem(null);
    setForm({ name: '', categoryKey: serviceCategories[0]?.key || '', defaultPrice: 0, unit: 'diaria', description: '' });
    setDialogOpen(true);
  };

  const openEdit = (item: ServiceItemRecord) => {
    setEditingItem(item);
    setForm({ name: item.name, categoryKey: item.categoryKey, defaultPrice: item.defaultPrice, unit: item.unit, description: item.description });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.categoryKey) { toast.error('Categoria é obrigatória'); return; }
    if (!workspaceId) return;

    setIsSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase.from('service_items').update({
          name: form.name.trim(),
          category_key: form.categoryKey,
          default_price: form.defaultPrice,
          unit: form.unit,
          description: form.description.trim(),
        }).eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Item atualizado!');
      } else {
        const { error } = await supabase.from('service_items').insert({
          workspace_id: workspaceId,
          name: form.name.trim(),
          category_key: form.categoryKey,
          default_price: form.defaultPrice,
          unit: form.unit,
          description: form.description.trim(),
        });
        if (error) throw error;
        toast.success('Item criado!');
      }
      setDialogOpen(false);
      loadItems();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('service_items').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir item'); return; }
    toast.success('Item excluído');
    setItems(prev => prev.filter(i => i.id !== id));
  };


  const getCategoryLabel = (key: string) => {
    return allCategories.find(c => c.key === key)?.label || key;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Itens de Serviço" subtitle="Catálogo de itens reutilizáveis para orçamentos" />

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {allCategories.map(cat => (
                  <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Item
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum item encontrado</p>
            <Button variant="outline" className="mt-4" onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro item
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedItems.map(({ category, items: catItems }) => (
              <div key={category.key} className="rounded-lg border overflow-hidden">
                <div className="bg-muted/60 px-4 py-3 flex items-center justify-between border-b">
                  <h3 className="font-semibold text-sm">{category.label}</h3>
                  <span className="text-xs text-muted-foreground">{catItems.length} {catItems.length === 1 ? 'item' : 'itens'}</span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead>Nome do Item</TableHead>
                      <TableHead>Valor Padrão</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="hidden md:table-cell">Descrição</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{formatCurrency(item.defaultPrice)}</TableCell>
                        <TableCell>{UNIT_LABELS[item.unit] || item.unit}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground text-sm">
                          {item.description || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item de Serviço'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Atualize os dados do item' : 'Cadastre um item reutilizável para orçamentos'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Item *</Label>
              <Input
                placeholder="Ex: Diretor de Fotografia"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria de Serviço *</Label>
              <Select value={form.categoryKey} onValueChange={(v) => setForm(f => ({ ...f, categoryKey: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map(cat => (
                    <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Padrão (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.defaultPrice || ''}
                  onChange={(e) => setForm(f => ({ ...f, defaultPrice: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={form.unit} onValueChange={(v) => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição opcional do item..."
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : editingItem ? 'Salvar' : 'Criar Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
