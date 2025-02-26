import { create } from 'zustand';
import { supabase } from '../services/supabase/supabaseClient';
import { useAuthStore } from './authStore';

interface Statistics {
  total_focus_minutes: number;
  total_sessions: number;
  tasks_completed: number;
  streak_days: number;
  longest_streak: number;
  last_session_date: string;
}

interface StatisticsStore {
  stats: Statistics;
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
  updateStats: (updates: Partial<Statistics>) => Promise<void>;
}

export const useStatisticsStore = create<StatisticsStore>((set, get) => ({
  stats: {
    total_focus_minutes: 0,
    total_sessions: 0,
    tasks_completed: 0,
    streak_days: 0,
    longest_streak: 0,
    last_session_date: new Date().toISOString()
  },
  loading: false,
  error: null,

  fetchStats: async () => {
    try {
      set({ loading: true });
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        set({ stats: data });
      }
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  updateStats: async (updates: Partial<Statistics>) => {
    try {
      set({ loading: true });
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const currentStats = get().stats;
      let newStreak = currentStats.streak_days;
      let longestStreak = currentStats.longest_streak;

      if (updates.last_session_date) {
        const lastDate = new Date(currentStats.last_session_date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate.toDateString() === yesterday.toDateString()) {
          newStreak += 1;
        } else if (lastDate.toDateString() !== today.toDateString()) {
          newStreak = 1;
        }

        longestStreak = Math.max(longestStreak, newStreak);
      }

      const { data, error } = await supabase
        .from('user_statistics')
        .upsert({
          user_id: user.id,
          ...currentStats,
          ...updates,
          streak_days: newStreak,
          longest_streak: longestStreak,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        set({ stats: data });
      }
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  }
})); 