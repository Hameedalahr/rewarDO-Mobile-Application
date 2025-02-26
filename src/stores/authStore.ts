import { create } from 'zustand';
import { AuthState, User, UserPreferences } from '../types/auth';
import { supabase } from '../services/supabase/supabaseClient';
import { initializeUserAchievements } from '../services/achievements/initializeAchievements';

interface AuthCredentials {
  email: string;
  password: string;
  full_name?: string;
}

const transformUser = (user: any) => ({
  id: user.id,
  email: user.email,
  full_name: user.user_metadata?.full_name || '',
});

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  error: null,

  setUser: (user: User | null) => set({ user }),
  setSession: (session: any | null) => set({ session }),
  setLoading: (loading: boolean) => set({ loading }),

  signIn: async (credentials: AuthCredentials) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      const user = transformUser(data.user);
      set({ user, session: data.session });

      // Initialize achievements for the user
      if (user) {
        await initializeUserAchievements(user.id);
      }

    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (credentials: AuthCredentials) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.full_name,
          },
        },
      });

      if (error) throw error;

      const user = transformUser(data.user);
      set({ user, session: data.session });

      // Initialize achievements for new user
      if (user) {
        await initializeUserAchievements(user.id);
      }

    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, session: null });
    } catch (error: any) {
      console.error('Error signing out:', error);
    }
  },

  updateUserProfile: async (updates) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) throw error;

      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata.full_name,
          avatar_url: data.user.user_metadata.avatar_url,
          preferences: data.user.user_metadata.preferences
        };
        set({ user });
      }
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  updateUserPreferences: async (preferences: UserPreferences) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.updateUser({
        data: { preferences }
      });

      if (error) throw error;

      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata.full_name,
          avatar_url: data.user.user_metadata.avatar_url,
          preferences: data.user.user_metadata.preferences
        };
        set({ user });
      }
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
})); 