import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Baby, Eye, EyeOff, Home } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export default function Auth() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  
  const from = '/admin';

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo de volta.',
      });
    }
    
    setLoading(false);
  };


  return (
    <>
      {/* Header with "Ver o Site" button */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to="/" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Ver Site</span>
            </Link>
          </Button>
        </div>
      </header>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-baby-blue/20 to-soft-pink/20 p-4 pt-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-baby-blue to-soft-pink p-3 rounded-full">
                <Baby className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-baby-blue">Portal Administrativo</h1>
            <p className="text-muted-foreground">Acesso restrito a administradores</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Login Administrativo</CardTitle>
              <CardDescription>
                Entre com suas credenciais de administrador
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@exemplo.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar no Portal Admin'}
                </Button>
                
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Apenas administradores autorizados podem acessar este portal.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}