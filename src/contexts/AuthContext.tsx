import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { getAllPageKeys } from '@/config/pages';

export type AppRole = 'owner' | 'admin' | 'vendedor' | 'visualizador';

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: AppRole;
  page_permissions: string[];
  joined_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  photo_url: string | null;
  created_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  profile: Profile | null;
  workspace: Workspace | null;
  membership: WorkspaceMember | null;
  role: AppRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string, workspaceName: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  hasPageAccess: (pageKey: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [membership, setMembership] = useState<WorkspaceMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role = membership?.role as AppRole | null;

  const loadUserData = async (userId: string) => {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      setProfile(profileData as Profile | null);

      // Load workspace membership
      const { data: memberData } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (memberData) {
        setMembership(memberData as unknown as WorkspaceMember);

        // Load workspace
        const { data: wsData } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', (memberData as any).workspace_id)
          .single();

        setWorkspace(wsData as Workspace | null);
      } else {
        setMembership(null);
        setWorkspace(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  useEffect(() => {
    let initialLoad = true;

    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Skip if this is the initial event (handled by getSession below)
        if (initialLoad) return;

        if (newSession?.user) {
          await loadUserData(newSession.user.id);
          setIsLoading(false);
        } else {
          setProfile(null);
          setWorkspace(null);
          setMembership(null);
          setIsLoading(false);
        }
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      initialLoad = false;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        await loadUserData(initialSession.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    workspaceName: string
  ): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) return { error: error.message };

    // If user was auto-confirmed (or email confirm disabled), create workspace
    if (data.user && data.session) {
      const { error: wsError } = await supabase.rpc('handle_signup_workspace', {
        workspace_name: workspaceName,
      });
      if (wsError) return { error: wsError.message };
    }

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setWorkspace(null);
    setMembership(null);
  };

  const hasPageAccess = (pageKey: string): boolean => {
    if (!membership) return false;
    // Owner and admin have access to everything
    if (role === 'owner' || role === 'admin') return true;
    // If no specific permissions set, grant all access
    if (!membership.page_permissions || membership.page_permissions.length === 0) return true;
    return membership.page_permissions.includes(pageKey);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        workspace,
        membership,
        role,
        isLoading,
        login,
        signup,
        logout,
        hasPageAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
