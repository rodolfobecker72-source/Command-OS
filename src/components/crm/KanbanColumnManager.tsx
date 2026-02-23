import { useState } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { KanbanColumn } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

export function KanbanColumnManager() {
  const { kanbanColumns, addKanbanColumn, updateKanbanColumn, deleteKanbanColumn } = useCRM();
  const [isOpen, setIsOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);
  
  // New column form
  const [newColumnLabel, setNewColumnLabel] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Generate key from label
  const generateKey = (label: string): string => {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleAddColumn = () => {
    if (!newColumnLabel.trim()) {
      toast.error('Digite um nome para o status');
      return;
    }

    const key = generateKey(newColumnLabel);
    
    // Check if key already exists
    if (kanbanColumns.some(c => c.key === key)) {
      toast.error('Já existe um status com este nome');
      return;
    }

    addKanbanColumn({
      key,
      label: newColumnLabel.trim(),
      color: 'bg-muted text-muted-foreground border-muted',
    });

    setNewColumnLabel('');
    setIsAddingNew(false);
    toast.success('Status adicionado!');
  };

  const handleUpdateColumn = () => {
    if (!editingColumn) return;
    
    if (!editingColumn.label.trim()) {
      toast.error('O nome do status não pode estar vazio');
      return;
    }

    updateKanbanColumn(editingColumn.id, {
      label: editingColumn.label.trim(),
    });

    setEditingColumn(null);
    toast.success('Status atualizado!');
  };

  const handleDeleteColumn = () => {
    if (!deleteColumnId) return;
    
    const column = kanbanColumns.find(c => c.id === deleteColumnId);
    if (column?.isDefault) {
      toast.error('Não é possível excluir status padrão do sistema');
      return;
    }

    deleteKanbanColumn(deleteColumnId);
    setDeleteColumnId(null);
    toast.success('Status removido! Os orçamentos foram movidos para o primeiro status.');
  };

  const sortedColumns = [...kanbanColumns].sort((a, b) => a.order - b.order);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Gerenciar Status
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Status do Orçamento</DialogTitle>
            <DialogDescription>
              Adicione, edite ou remova os status do pipeline de vendas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto py-4">
            {sortedColumns.map((column, index) => (
              <div
                key={column.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                
                <div className="flex-1">
                  {editingColumn?.id === column.id ? (
                    <Input
                      value={editingColumn.label}
                      onChange={(e) =>
                        setEditingColumn({ ...editingColumn, label: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateColumn();
                        if (e.key === 'Escape') setEditingColumn(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{column.label}</span>
                      {column.isDefault && (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {editingColumn?.id === column.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleUpdateColumn}
                      >
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingColumn(null)}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingColumn(column)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {!column.isDefault && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteColumnId(column.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Add new column */}
            {isAddingNew ? (
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border-2 border-dashed border-primary/20">
                <div className="flex-1">
                  <Input
                    value={newColumnLabel}
                    onChange={(e) => setNewColumnLabel(e.target.value)}
                    placeholder="Nome do novo status..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddColumn();
                      if (e.key === 'Escape') {
                        setIsAddingNew(false);
                        setNewColumnLabel('');
                      }
                    }}
                    autoFocus
                  />
                </div>
                <Button size="sm" onClick={handleAddColumn}>
                  Adicionar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewColumnLabel('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setIsAddingNew(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Novo Status
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteColumnId} onOpenChange={() => setDeleteColumnId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Status</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este status? Os orçamentos nele serão
              movidos automaticamente para o primeiro status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteColumn}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
