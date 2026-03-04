import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth, type AppRole, type Profile } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Pencil, Trash2, UserPlus, Crown, ShieldCheck, Eye as EyeIcon, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface MemberWithProfile {
  id: string;
  user_id: string;
  role: AppRole;
  joined_at: string;
  profile: Profile | null;
}

const ROLE_LABELS: Record<AppRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  vendedor: 'Vendedor',
  visualizador: 'Visualizador',
};

const ROLE_ICONS: Record<AppRole, typeof Crown> = {
  owner: Crown,
  admin: ShieldCheck,
  vendedor: Briefcase,
  visualizador: EyeIcon,
};

const ROLE_COLORS: Record<AppRole, string> = {
  owner: 'bg-primary/10 text-primary',
  admin: 'bg-accent/10 text-accent',
  vendedor: 'bg-warning/10 text-warning',
  visualizador: 'bg-muted text-muted-foreground',
};

export function UsersPage() {
  const { workspace, role: currentRole } = useAuth();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'vendedor' as AppRole,
  });

  const [editForm, setEditForm] = useState({
    role: 'vendedor' as AppRole,
  });

  const canManage = currentRole === 'owner';

  const loadMembers = async () => {
    if (!workspace) return;
    setIsLoading(true);

    const { data: memberData } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspace.id);

    if (memberData) {
      const membersWithProfiles: MemberWithProfile[] = [];
      for (const m of memberData) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', m.user_id)
          .single();

        membersWithProfiles.push({
          id: m.id,
          user_id: m.user_id,
          role: m.role as AppRole,
          joined_at: m.joined_at,
          profile: profileData as Profile | null,
        });
      }
      setMembers(membersWithProfiles);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, [workspace]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password || !createForm.name) return;

    setIsCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('create-member', {
        body: {
          email: createForm.email,
          password: createForm.password,
          name: createForm.name,
          role: createForm.role,
        },
      });

      if (response.error) {
        toast.error('Erro ao criar membro: ' + (response.error.message || 'Erro desconhecido'));
        setIsCreating(false);
        return;
      }

      const result = response.data;
      if (result?.error) {
        toast.error('Erro ao criar membro: ' + result.error);
        setIsCreating(false);
        return;
      }

      toast.success(`Membro ${createForm.name} criado com sucesso!`);
      setIsCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'vendedor' });
      loadMembers();
    } catch (err: any) {
      toast.error('Erro ao criar membro: ' + err.message);
    }
    setIsCreating(false);
  };

  const handleEditMember = (member: MemberWithProfile) => {
    setEditingMember(member);
    setEditForm({ role: member.role });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;

    const { error } = await supabase
      .from('workspace_members')
      .update({ role: editForm.role })
      .eq('id', editingMember.id);

    if (error) {
      toast.error('Erro ao atualizar: ' + error.message);
      return;
    }

    toast.success('Membro atualizado!');
    setIsEditOpen(false);
    setEditingMember(null);
    loadMembers();
  };

  const handleRemoveMember = async (member: MemberWithProfile) => {
    if (member.role === 'owner') {
      toast.error('Não é possível remover o proprietário');
      return;
    }

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', member.id);

    if (error) {
      toast.error('Erro ao remover: ' + error.message);
      return;
    }

    toast.success('Membro removido!');
    loadMembers();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (currentRole !== 'owner') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Apenas o proprietário pode acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Equipe" subtitle={workspace ? `Membros de ${workspace.name}` : 'Gerenciamento de equipe'} />

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Membros ({members.length})</CardTitle>
            {canManage && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Novo Membro
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Membro</DialogTitle>
                    <DialogDescription>
                      Crie uma conta para um novo membro da equipe.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="create-name">Nome</Label>
                      <Input
                        id="create-name"
                        type="text"
                        placeholder="Nome completo"
                        value={createForm.name}
                        onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-email">Email</Label>
                      <Input
                        id="create-email"
                        type="email"
                        placeholder="email@exemplo.com"
                        value={createForm.email}
                        onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-password">Senha</Label>
                      <PasswordInput
                        id="create-password"
                        placeholder="Mínimo 6 caracteres"
                        value={createForm.password}
                        onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Papel</Label>
                      <Select
                        value={createForm.role}
                        onValueChange={(v: AppRole) => setCreateForm({ ...createForm, role: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="vendedor">Vendedor</SelectItem>
                          <SelectItem value="visualizador">Visualizador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? 'Criando...' : 'Criar Membro'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membro</TableHead>
                    <TableHead>Papel</TableHead>
                    {canManage && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(member => {
                    const RoleIcon = ROLE_ICONS[member.role];
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.profile?.photo_url || undefined} />
                              <AvatarFallback>
                                {member.profile ? getInitials(member.profile.name) : '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.profile?.name || 'Sem nome'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={ROLE_COLORS[member.role]}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {ROLE_LABELS[member.role]}
                          </Badge>
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {member.role !== 'owner' && (
                                <>
                                  <Button variant="ghost" size="icon" onClick={() => handleEditMember(member)}>
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleRemoveMember(member)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Member Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Membro</DialogTitle>
              <DialogDescription>
                Altere o papel de {editingMember?.profile?.name || 'membro'}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Papel</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v: AppRole) => setEditForm({ role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="visualizador">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveEdit}>Salvar</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
