import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Save, Trash2, ImageIcon } from 'lucide-react';

export function LayoutPage() {
  const { workspace } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspace) return;
    loadLayout();
  }, [workspace]);

  const loadLayout = async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_layout')
        .select('*')
        .eq('workspace_id', workspace.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setExistingId(data.id);
        setLogoUrl((data as any).logo_url || '');
        setCompanyName((data as any).company_name || '');
        setWebsite((data as any).website || '');
        setEmail((data as any).email || '');
      }
    } catch (err) {
      console.error('Error loading layout:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspace) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `${workspace.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setLogoUrl(`${publicUrlData.publicUrl}?t=${Date.now()}`);
      toast.success('Logo enviada com sucesso!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Erro ao enviar logo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
  };

  const handleSave = async () => {
    if (!workspace) return;
    setSaving(true);
    try {
      const payload = {
        workspace_id: workspace.id,
        logo_url: logoUrl,
        company_name: companyName,
        website,
        email,
      };

      if (existingId) {
        const { error } = await supabase
          .from('workspace_layout')
          .update(payload)
          .eq('id', existingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('workspace_layout')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        setExistingId(data.id);
      }

      toast.success('Layout salvo com sucesso!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Erro ao salvar layout');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1">
        <Header title="Layout do PDF" subtitle="Configurações de identidade visual para documentos" />
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <Header title="Layout do PDF" subtitle="Configurações de identidade visual para documentos" />

      <div className="p-6 max-w-2xl space-y-6">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Logo do Cabeçalho</CardTitle>
            <CardDescription>
              Esta logo será exibida no cabeçalho dos PDFs gerados. Recomendamos uma imagem na proporção <strong>1:1 (quadrada)</strong> para melhor resultado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              {/* Preview */}
              <div
                className="w-28 h-28 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/30 cursor-pointer hover:border-primary/50 transition-colors shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-xs">1:1</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  {uploading ? 'Enviando...' : 'Enviar logo'}
                </Button>
                {logoUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Remover
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  PNG ou JPG. Proporção 1:1 recomendada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações do Rodapé</CardTitle>
            <CardDescription>
              Esses dados serão exibidos no rodapé de todos os PDFs gerados pelo sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Produtora</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Minha Produtora Audiovisual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Site</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Ex: www.minhaprodutora.com.br"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: contato@minhaprodutora.com.br"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? 'Salvando...' : 'Salvar Layout'}
          </Button>
        </div>
      </div>
    </div>
  );
}
