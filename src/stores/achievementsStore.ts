import { create } from 'zustand';
import { supabase } from '../services/supabase/supabaseClient';
import { useAuthStore } from './authStore';

// Define achievement types
type AchievementType = 'coins' | 'focus' | 'task' | 'streak' | 'milestone' | 'sessions' | 'focus_time';

interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  current_value: number;
  progress: number;
  completed: boolean;
  reward: number;
  reward_claimed: boolean;
  date?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface AchievementsState {
  achievements: Achievement[];
  currentStreak: number;
  longestStreak: number;
  loading: boolean;
  error: string | null;
  fetchAchievements: () => Promise<void>;
  updateAchievements: (data: { duration: number; completed: boolean }) => Promise<void>;
  updateAchievement: (id: string, updates: Partial<Achievement>) => Promise<void>;
  updateFocusAchievement: (sessionCompleted: boolean) => Promise<void>;
  updateTaskAchievement: (tasksCompleted: number) => Promise<void>;
  updateProgress: (progress: Partial<AchievementProgress>) => Promise<void>;
  claimReward: (achievementId: string) => Promise<void>;
}

interface AchievementProgress {
  focusMinutes: number;
  tasksCompleted: number;
  streakDays: number;
  coinsEarned: number;
  sessions: number;
}

export const useAchievementsStore = create<AchievementsState>((set, get) => ({
  achievements: [],
  currentStreak: 0,
  longestStreak: 0,
  loading: false,
  error: null,

  fetchAchievements: async () => {
    try {
      set({ loading: true });
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      console.log('Fetching achievements for user:', user.id);

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);

      console.log('Fetched achievements:', data);
      console.log('Error if any:', error);

      if (error) throw error;
      set({ achievements: data || [] });
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  updateProgress: async (progress: Partial<AchievementProgress>) => {
    try {
      set({ loading: true });
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      // Get current achievements
      const { data: currentData, error: fetchError } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;
      const currentAchievements = currentData || [];

      // Check and update achievements based on progress
      const updates = currentAchievements.map(achievement => {
        let newProgress = achievement.progress;

        switch (achievement.type) {
          case 'focus':
            if (progress.focusMinutes) {
              newProgress = Math.min(100, (achievement.current_value + progress.focusMinutes) * 100 / achievement.requirement);
            }
            break;
          case 'task':
            if (progress.tasksCompleted) {
              newProgress = Math.min(100, (achievement.current_value + progress.tasksCompleted) * 100 / achievement.requirement);
            }
            break;
          case 'streak':
            if (progress.streakDays) {
              newProgress = Math.min(100, (achievement.current_value + progress.streakDays) * 100 / achievement.requirement);
            }
            break;
          case 'coins':
            if (progress.coinsEarned) {
              newProgress = Math.min(100, (achievement.current_value + progress.coinsEarned) * 100 / achievement.requirement);
            }
            break;
        }

        return {
          ...achievement,
          progress: newProgress,
          current_value: achievement.current_value + (
            progress.focusMinutes || 
            progress.tasksCompleted || 
            progress.streakDays || 
            progress.coinsEarned || 
            0
          ),
          completed: newProgress >= 100,
          updated_at: new Date().toISOString()
        };
      });

      // Update achievements in database
      for (const achievement of updates) {
        const { error: updateError } = await supabase
          .from('achievements')
          .update(achievement)
          .eq('id', achievement.id);

        if (updateError) throw updateError;
      }

      set({ achievements: updates });
    } catch (error: any) {
      console.error('Error updating achievements:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  updateAchievements: async (data) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;

      // Update streak if session was completed
      if (data.completed) {
        const today = new Date().toISOString().split('T')[0];
        const { data: lastSession } = await supabase
          .from('focus_sessions')
          .select('created_at')
          .eq('user_id', user.id)
          .eq('completed', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let { currentStreak } = get();
        
        if (lastSession) {
          const lastSessionDate = new Date(lastSession.created_at).toISOString().split('T')[0];
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastSessionDate === yesterdayStr) {
            currentStreak += 1;
          } else if (lastSessionDate !== today) {
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }

        const longestStreak = Math.max(currentStreak, get().longestStreak);

        // Update streaks in database
        await supabase
          .from('user_streaks')
          .upsert({
            user_id: user.id,
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_session_date: today,
          });

        set({ currentStreak, longestStreak });
      }

      const { achievements } = get();
      const updates = [];

      for (const achievement of achievements) {
        let progress = 0;

        switch (achievement.type) {
          case 'sessions':
            progress = data.completed ? 1 : 0;
            break;
          case 'focus_time':
            progress = Math.floor(data.duration / 60);
            break;
        }

        if (progress > 0) {
          updates.push({
            user_id: user.id,
            achievement_id: achievement.id,
            progress: progress,
            unlocked: progress >= achievement.requirement,
            unlocked_at: progress >= achievement.requirement ? new Date().toISOString() : null,
          });
        }
      }

      if (updates.length > 0) {
        const { error } = await supabase
          .from('user_achievements')
          .upsert(updates, { onConflict: 'user_id,achievement_id' });

        if (error) throw error;
      }

      await get().fetchAchievements();
    } catch (error: any) {
      console.error('Error updating achievements:', error);
    }
  },

  updateAchievement: async (id: string, updates: Partial<Achievement>) => {
    try {
      set({ loading: true });
      const { achievements } = get();
      const updatedAchievements = achievements.map(achievement => 
        achievement.id === id ? { ...achievement, ...updates } : achievement
      );
      set({ achievements: updatedAchievements, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateFocusAchievement: async (sessionCompleted: boolean) => {
    const achievements = get().achievements.map(achievement => {
      if (achievement.type === 'focus') {
        const newProgress = sessionCompleted ? achievement.progress + 1 : achievement.progress;
        return {
          ...achievement,
          progress: newProgress,
          completed: newProgress >= achievement.requirement,
          date: newProgress >= achievement.requirement ? new Date().toISOString() : achievement.date
        };
      }
      return achievement;
    });
    set({ achievements });
  },

  updateTaskAchievement: async (tasksCompleted: number) => {
    const achievements = get().achievements.map(achievement => {
      if (achievement.type === 'task') {
        return {
          ...achievement,
          progress: tasksCompleted,
          completed: tasksCompleted >= achievement.requirement,
          date: tasksCompleted >= achievement.requirement ? new Date().toISOString() : achievement.date
        };
      }
      return achievement;
    });
    set({ achievements });
  },

  claimReward: async (achievementId: string) => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .update({ reward_claimed: true })
        .eq('id', achievementId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set(state => ({
        achievements: state.achievements.map(achievement =>
          achievement.id === achievementId
            ? { ...achievement, reward_claimed: true }
            : achievement
        )
      }));

      return data;
    } catch (error) {
      console.error('Error claiming reward:', error);
      throw error;
    }
  },
})); 