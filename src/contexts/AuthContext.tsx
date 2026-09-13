import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { hasSupabase } from "@/lib/config";
const AuthContext = createContext<{
  user: User | null;
  session: Session | null;
  loading: boolean;
}>({ user: null, session: null, loading: true });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({
    user: null as User | null,
    session: null as Session | null,
    loading: hasSupabase,
  });
  useEffect(() => {
    if (!hasSupabase) return;
    let active = true;
    const update = (session: Session | null) => {
      if (active)
        setState({ user: session?.user || null, session, loading: false });
    };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => update(session));
    supabase.auth
      .getSession()
      .then(({ data }) => update(data.session))
      .catch(() => update(null));
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
export const useAuthState = () => useContext(AuthContext);
