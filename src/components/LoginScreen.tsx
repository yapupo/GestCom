import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ALLOWED_EMAIL_PASSWORD, isAllowedEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, ShieldAlert } from "lucide-react";
import betoneiraLogo from "@/assets/betoneira.png";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized = email.trim().toLowerCase();
    if (normalized !== ALLOWED_EMAIL_PASSWORD.toLowerCase()) {
      setError("Acesso não autorizado.");
      return;
    }

    setLoading(true);
    try {
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      });

      // Primeiro acesso: cria o usuário root automaticamente
      if (signInError && /invalid/i.test(signInError.message)) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: normalized,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) {
          setError("Não foi possível entrar. Verifique a senha.");
          return;
        }
        const retry = await supabase.auth.signInWithPassword({
          email: normalized,
          password,
        });
        signInError = retry.error ?? null;
      }

      if (signInError) {
        setError("Acesso não autorizado.");
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (!isAllowedEmail(data.user?.email)) {
        await supabase.auth.signOut();
        setError("Acesso não autorizado.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError("Não foi possível entrar com o Google.");
        return;
      }
      if (result.redirected) return;

      const { data } = await supabase.auth.getUser();
      if (!isAllowedEmail(data.user?.email)) {
        await supabase.auth.signOut();
        setError("Acesso não autorizado.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-20 w-20 rounded-3xl bg-card border border-border shadow-[var(--shadow-warm)] overflow-hidden flex items-center justify-center mb-3">
            <img src={betoneiraLogo} alt="Empada do Betoneira" className="h-18 w-18 object-contain" />
          </div>
          <h1 className="text-2xl font-bold">Empada do Betoneira</h1>
          <p className="text-sm text-muted-foreground">Acesso restrito</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)] space-y-4">
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="h-4 w-4 mr-2" />Entrar</>}
            </Button>
          </form>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            ou
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                <span className="ml-2">Entrar com Google</span>
              </>
            )}
          </Button>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
