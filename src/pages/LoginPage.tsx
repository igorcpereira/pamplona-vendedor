import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error("Email ou senha incorretos.");
    } else {
      navigate("/", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Marca d'água */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <Logo className="w-96 h-96" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo className="w-24 h-24" />
        </div>

        <h1 className="font-display text-2xl font-medium tracking-wide text-center text-foreground mb-2">
          Pamplona Alfaiataria
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Acesse sua conta para continuar
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              className="w-full bg-transparent border-0 border-b border-secondary focus:border-primary outline-none py-2 text-foreground placeholder:text-muted-foreground/50 transition-colors text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-transparent border-0 border-b border-secondary focus:border-primary outline-none py-2 text-foreground placeholder:text-muted-foreground/50 transition-colors text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading || !email || !password}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
