import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Plus, Search, Pencil, Trash2, Package, Building2, ExternalLink, Loader2, DollarSign, Hash, ShieldCheck,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

type AssetCategory = 'equipamento' | 'estrutura';

interface Asset {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  value: number;
  serial_number: string;
  hero_asset_number: string;
  photo: string;
  reference_link: string;
  assigned_to: string;
  category: AssetCategory;
  needs_insurance: boolean;
  quantity: number;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  name: '',
  description: '',
  value: 0,
  serial_number: '',
  hero_asset_number: '',
  reference_link: '',
  assigned_to: '',
  category: 'equipamento' as AssetCategory,
  needs_insurance: false,
  quantity: 1,
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export function PatrimonioPage() {
  const { workspace } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (workspace?.id) loadAssets();
  }, [workspace?.id]);

  async function loadAssets() {
    if (!workspace?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('name', { ascending: true });
    if (error) {
      toast.error('Erro ao carregar patrimônio: ' + error.message);
    } else {
      setAssets((data as Asset[]) || []);
    }
    setLoading(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  }

  function openEdit(asset: Asset) {
    setEditingId(asset.id);
    setForm({
      name: asset.name,
      description: asset.description,
      value: Number(asset.value) || 0,
      serial_number: asset.serial_number,
      hero_asset_number: asset.hero_asset_number,
      reference_link: asset.reference_link,
      assigned_to: asset.assigned_to,
      category: (asset.category as AssetCategory) || 'equipamento',
      needs_insurance: !!asset.needs_insurance,
      quantity: Number(asset.quantity) || 1,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!workspace?.id) return;
    if (!form.name.trim()) {
      toast.error('Informe o nome do item.');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      value: Number(form.value) || 0,
      workspace_id: workspace.id,
    };
    const query = editingId
      ? supabase.from('assets').update(payload).eq('id', editingId)
      : supabase.from('assets').insert(payload);
    const { error } = await query;
    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } else {
      toast.success(editingId ? 'Patrimônio atualizado!' : 'Patrimônio cadastrado!');
      setDialogOpen(false);
      await loadAssets();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from('assets').delete().eq('id', deleteId);
    if (error) {
      toast.error('Erro ao excluir: ' + error.message);
    } else {
      toast.success('Item excluído.');
      setAssets(prev => prev.filter(a => a.id !== deleteId));
    }
    setDeleteId(null);
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return assets;
    return assets.filter(a =>
      a.name.toLowerCase().includes(s) ||
      a.description.toLowerCase().includes(s) ||
      a.serial_number.toLowerCase().includes(s) ||
      a.hero_asset_number.toLowerCase().includes(s) ||
      a.assigned_to.toLowerCase().includes(s),
    );
  }, [assets, search]);

  const totals = useMemo(() => ({
    count: assets.length,
    units: assets.reduce((sum, a) => sum + (Number(a.quantity) || 1), 0),
    value: assets.reduce((sum, a) => sum + (Number(a.value) || 0) * (Number(a.quantity) || 1), 0),
  }), [assets]);

  return (
    <div>
      <Header title="Patrimônio" subtitle="Cadastro dos bens e equipamentos" />
      <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Patrimônio
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastro dos bens e equipamentos da produtora.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Novo item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar patrimônio' : 'Novo patrimônio'}</DialogTitle>
              <DialogDescription>
                Preencha os dados do item para registrar no patrimônio da produtora.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="name">Nome do item *</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Câmera Sony FX3" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes, modelo, acessórios..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Valor unitário (R$)</Label>
                  <Input id="value" type="number" step="0.01" min="0" value={form.value} onChange={(e) => setForm(f => ({ ...f, value: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input id="quantity" type="number" min="1" step="1" value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_asset_number">Nº Patrimônio Hero</Label>
                  <Input id="hero_asset_number" value={form.hero_asset_number} onChange={(e) => setForm(f => ({ ...f, hero_asset_number: e.target.value }))} placeholder="Ex: HERO-0001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial_number">Nº de Série</Label>
                  <Input id="serial_number" value={form.serial_number} onChange={(e) => setForm(f => ({ ...f, serial_number: e.target.value }))} placeholder="Serial do fabricante" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Responsável / Alocado em</Label>
                  <Input id="assigned_to" value={form.assigned_to} onChange={(e) => setForm(f => ({ ...f, assigned_to: e.target.value }))} placeholder="Pessoa ou local" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v as AssetCategory }))}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipamento">Equipamento</SelectItem>
                      <SelectItem value="estrutura">Estrutura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="reference_link">Link de referência</Label>
                  <Input id="reference_link" value={form.reference_link} onChange={(e) => setForm(f => ({ ...f, reference_link: e.target.value }))} placeholder="Ex: link da nota fiscal ou loja" />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2 rounded-md border p-3 bg-muted/30">
                  <Checkbox
                    id="needs_insurance"
                    checked={form.needs_insurance}
                    onCheckedChange={(c) => setForm(f => ({ ...f, needs_insurance: c === true }))}
                  />
                  <Label htmlFor="needs_insurance" className="cursor-pointer flex items-center gap-2 font-normal">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Necessita de seguro
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? 'Salvar alterações' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Itens cadastrados</p>
              <p className="text-xl font-bold">{totals.count}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor total</p>
              <p className="text-xl font-bold">{formatCurrency(totals.value)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, série, patrimônio ou responsável..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {assets.length === 0 ? 'Nenhum patrimônio cadastrado ainda.' : 'Nenhum item encontrado para a busca.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Nº Hero</TableHead>
                    <TableHead>Nº Série</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => {
                    const isEstrutura = a.category === 'estrutura';
                    const Icon = isEstrutura ? Building2 : Package;
                    return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          {a.name}
                          {a.needs_insurance && (
                            <Badge variant="secondary" className="gap-1">
                              <ShieldCheck className="w-3 h-3" /> Seguro
                            </Badge>
                          )}
                        </div>
                        {a.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">{a.description}</div>
                        )}
                        {a.reference_link && (
                          <a href={a.reference_link} target="_blank" rel="noreferrer" className="text-xs text-accent inline-flex items-center gap-1 hover:underline">
                            <ExternalLink className="w-3 h-3" /> referência
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isEstrutura ? 'outline' : 'default'}>
                          {isEstrutura ? 'Estrutura' : 'Equipamento'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono">{a.hero_asset_number || '—'}</TableCell>
                      <TableCell className="text-sm font-mono">{a.serial_number || '—'}</TableCell>
                      <TableCell className="text-sm">{a.assigned_to || '—'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(a.value))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(a)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(a.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );})}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir patrimônio?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
