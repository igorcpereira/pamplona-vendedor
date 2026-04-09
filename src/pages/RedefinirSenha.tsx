import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';

const RedefinirSenha = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (!tokenHash || type !== 'recovery') {
      setVerificando(false);
      return;
    }

    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: 'recovery' })
      .then(({ error }) => {
        if (error) {
          setTokenValido(false);
        } else {
          setTokenValido(true);
        }
      })
      .finally(() => setVerificando(false));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (novaSenha.length < 6) return;
    if (novaSenha !== confirmarSenha) return;

    setErro(null);
    setLoading(true);
    try {
      const { error: senhaError } = await supabase.auth.updateUser({ password: novaSenha });
      if (senhaError) throw senhaError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ senha_temporaria: false }).eq('id', user.id);
      }

      navigate('/');
    } catch (error: any) {
      const mensagem = error.message || 'Erro ao redefinir senha';
      setErro(mensagem);
      console.error('Erro ao redefinir senha:', error);
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
        {verificando ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verificando link...</p>
          </div>
        ) : !tokenValido ? (
          <div className="text-center py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Este link é inválido ou já expirou.
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
              Voltar ao login
            </Button>
          </div>
        ) : (
          <>
            <CardHeader className="p-0 mb-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-xl">Crie sua nova senha</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Escolha uma senha segura para sua conta.
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

                {erro && (
                  <p className="text-sm text-destructive text-center bg-destructive/10 border border-destructive/20 rounded p-3">
                    {erro}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default RedefinirSenha;
