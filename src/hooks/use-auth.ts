import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isAllowedEmail } from "@/lib/auth";

export type AuthState = {
  loading: boolean;
  session: Session | null;
  authorized: boolean;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    authorized: false,
  });

  useEffect(() => {
    let mounted = true;

    const apply = (session: Session | null) => {
      if (!mounted) return;
      const authorized = isAllowedEmail(session?.user?.email);
      setState({ loading: false, session, authorized });
      // Se logou mas não está na whitelist, derruba a sessão
      if (session && !authorized) {
        supabase.auth.signOut();
      }
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
