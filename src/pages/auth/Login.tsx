import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import commandLogo from '@/assets/command-logo.png';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await login(email, password);
    
    if (!error) {
      toast.success('Login realizado com sucesso!');
      navigate('/clientes');
    } else {
      toast.error(error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-sidebar-background flex flex-col items-center justify-center p-4 gap-8">
      <img 
        src={commandLogo} 
        alt="Command CRM" 
        className="h-14 w-auto"
      />

      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center space-y-1.5 pb-2">
          <CardTitle className="text-2xl text-foreground">Bem-vindo ao Command CRM</CardTitle>
          <CardDescription className="text-muted-foreground leading-relaxed">
            Sistema interno de gestão da produtora.<br />
            Digite suas credenciais para acessar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="text-sm text-muted-foreground text-center pt-2">
              Não tem uma conta?{' '}
              <Link to="/signup" className="text-primary hover:underline">
                Criar conta
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
