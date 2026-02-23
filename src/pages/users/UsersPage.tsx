import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth, type AppRole, type WorkspaceMember, type Profile } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { APP_PAGES, getAllPageKeys, getPagesByGroup } from '@/config/pages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Pencil, Trash2, Shield, UserPlus, Crown, ShieldCheck, Eye as EyeIcon, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface MemberWithProfile {
  id: string;
  user_id: string;
  role: AppRole;
  page_permissions: string[];
  joined_at: string;
  profile: Profile | null;
  email?: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: AppRole;
  page_permissions: string[];
  created_at: string;
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
  const { workspace, role: currentRole, membership } = useAuth();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'vendedor' as AppRole,
    pagePermissions: getAllPageKeys(),
  });

  const [editForm, setEditForm] = useState({
    role: 'vendedor' as AppRole,
    pagePermissions: getAllPageKeys(),
  });

  const pagesByGroup = getPagesByGroup();
  const canManage = currentRole === 'owner' || currentRole === 'admin';

  const loadMembers = async () => {
    if (!workspace) return;
    setIsLoading(true);

    // Load members
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
          page_permissions: (m.page_permissions as string[]) || [],
          joined_at: m.joined_at,
          profile: profileData as Profile | null,
        });
      }
      setMembers(membersWithProfiles);
    }

    // Load pending invites
    const { data: inviteData } = await supabase
      .from('workspace_invites')
      .select('*')
      .eq('workspace_id', workspace.id)
      .is('accepted_at', null);

    if (inviteData) {
      setInvites(inviteData.map(i => ({
        id: i.id,
        email: i.email,
        role: i.role as AppRole,
        page_permissions: (i.page_permissions as string[]) || [],
        created_at: i.created_at,
      })));
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, [workspace]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !inviteForm.email) return;

    const { error } = await supabase.from('workspace_invites').insert({
      workspace_id: workspace.id,
      email: inviteForm.email,
      role: inviteForm.role,
      page_permissions: inviteForm.pagePermissions,
    });

    if (error) {
      toast.error('Erro ao enviar convite: ' + error.message);
      return;
    }

    toast.success(`Convite enviado para ${inviteForm.email}`);
    setIsInviteOpen(false);
    setInviteForm({ email: '', role: 'vendedor', pagePermissions: getAllPageKeys() });
    loadMembers();
  };

  const handleEditMember = (member: MemberWithProfile) => {
    setEditingMember(member);
    setEditForm({
      role: member.role,
      pagePermissions: member.page_permissions.length > 0 ? member.page_permissions : getAllPageKeys(),
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;

    const { error } = await supabase
      .from('workspace_members')
      .update({
        role: editForm.role,
        page_permissions: editForm.pagePermissions,
      })
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

  const handleDeleteInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from('workspace_invites')
      .delete()
      .eq('id', inviteId);

    if (error) {
      toast.error('Erro ao cancelar convite');
      return;
    }

    toast.success('Convite cancelado');
    loadMembers();
  };

  const togglePermission = (pageKey: string, form: 'invite' | 'edit') => {
    if (form === 'invite') {
      setInviteForm(prev => ({
        ...prev,
        pagePermissions: prev.pagePermissions.includes(pageKey)
          ? prev.pagePermissions.filter(k => k !== pageKey)
          : [...prev.pagePermissions, pageKey],
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        pagePermissions: prev.pagePermissions.includes(pageKey)
          ? prev.pagePermissions.filter(k => k !== pageKey)
          : [...prev.pagePermissions, pageKey],
      }));
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const PermissionsBlock = ({ permissions, formType }: { permissions: string[]; formType: 'invite' | 'edit' }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" />
          Permissões de Acesso
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs h-7"
          onClick={() => {
            const allKeys = getAllPageKeys();
            const hasAll = allKeys.every(k => permissions.includes(k));
            if (formType === 'invite') {
              setInviteForm(prev => ({ ...prev, pagePermissions: hasAll ? [] : allKeys }));
            } else {
              setEditForm(prev => ({ ...prev, pagePermissions: hasAll ? [] : allKeys }));
            }
          }}
        >
          {getAllPageKeys().every(k => permissions.includes(k)) ? 'Desmarcar Todos' : 'Marcar Todos'}
        </Button>
      </div>
      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        {Object.entries(pagesByGroup).map(([group, pages]) => (
          <div key={group}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{group}</p>
            <div className="space-y-2 pl-1">
              {pages.map(page => (
                <div key={page.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`perm-${formType}-${page.key}`}
                    checked={permissions.includes(page.key)}
                    onCheckedChange={() => togglePermission(page.key, formType)}
                  />
                  <label htmlFor={`perm-${formType}-${page.key}`} className="text-sm cursor-pointer select-none">
                    {page.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header title="Equipe" subtitle={workspace ? `Membros de ${workspace.name}` : 'Gerenciamento de equipe'} />

      <div className="p-6 space-y-6">
        {/* Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Membros ({members.length})</CardTitle>
            {canManage && (
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Convidar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Convidar Membro</DialogTitle>
                    <DialogDescription>
                      Envie um convite por email para adicionar alguém à equipe.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="email@exemplo.com"
                        value={inviteForm.email}
                        onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Papel</Label>
                      <Select
                        value={inviteForm.role}
                        onValueChange={(v: AppRole) => setInviteForm({ ...inviteForm, role: v })}
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
                    <PermissionsBlock permissions={inviteForm.pagePermissions} formType="invite" />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Enviar Convite</Button>
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
                    <TableHead>Permissões</TableHead>
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
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {member.page_permissions.length === 0 || member.page_permissions.length === APP_PAGES.length ? (
                              <span className="px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded">
                                Acesso Total
                              </span>
                            ) : (
                              member.page_permissions.map(key => {
                                const page = APP_PAGES.find(p => p.key === key);
                                return page ? (
                                  <span key={key} className="px-2 py-0.5 text-xs font-medium bg-accent/10 text-accent rounded">
                                    {page.label}
                                  </span>
                                ) : null;
                              })
                            )}
                          </div>
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

        {/* Pending Invites */}
        {canManage && invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Convites Pendentes ({invites.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map(invite => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={ROLE_COLORS[invite.role]}>
                          {ROLE_LABELS[invite.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteInvite(invite.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Edit Member Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Membro</DialogTitle>
              <DialogDescription>
                Altere o papel e as permissões de {editingMember?.profile?.name || 'membro'}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Papel</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v: AppRole) => setEditForm({ ...editForm, role: v })}
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
              <PermissionsBlock permissions={editForm.pagePermissions} formType="edit" />
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
