import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';

const SENHA_PADRAO = 'Mudar@123';

const AlterarSenha = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (novaSenha === SENHA_PADRAO) return;
    if (novaSenha.length < 6) return;
    if (novaSenha !== confirmarSenha) return;

    setLoading(true);
    try {
      const { error: senhaError } = await supabase.auth.updateUser({ password: novaSenha });
      if (senhaError) throw senhaError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ senha_temporaria: false })
        .eq('id', user!.id);
      if (profileError) throw profileError;

      navigate('/');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <Logo className="w-96 h-96 object-contain" />
      </div>

      <Card className="w-full max-w-md p-8 relative z-10">
        <CardHeader className="p-0 mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Altere sua senha</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Este é seu primeiro acesso. Por segurança, defina uma senha pessoal antes de continuar.
          </p>
        </CardHeader>

        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nova-senha">Nova senha</Label>
              <Input
                id="nova-senha"
                name="nova-senha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
              <Input
                id="confirmar-senha"
                name="confirmar-senha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a senha"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : 'Definir senha e entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlterarSenha;
