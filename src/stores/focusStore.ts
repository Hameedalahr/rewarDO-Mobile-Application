import { create } from 'zustand';
import { FocusStore, FocusSession } from '../types/focus';
import { supabase } from '../services/supabase/supabaseClient';
import { useAuthStore } from './authStore';
import { generateUUID } from '../utils/uuid';
import { useAchievementsStore } from './achievementsStore';
import { useCoinsStore } from './coinsStore';
import { useStatisticsStore } from './statisticsStore';

// Define Timer type
type Timer = ReturnType<typeof setInterval>;

interface FocusState extends FocusStore {
  breakTimer?: NodeJS.Timeout;
  focusTimer?: NodeJS.Timeout;
  totalMinutes: number;
  totalSessions: number;
}

const BREAK_DURATION = 30; // 30 seconds break
const DAILY_COIN_LIMIT = 100;

export const useFocusStore = create<FocusState>((set, get) => ({
  currentSession: null,
  sessions: [],
  loading: false,
  error: null,
  timeLeft: 0,
  isActive: false,
  isBreak: false,
  breakTimer: undefined,
  focusTimer: undefined,
  totalMinutes: 0,
  totalSessions: 0,

  startSession: async (taskId: string, durationInMinutes: number) => {
    try {
      set({ loading: true, isBreak: false });
      const user = useAuthStore.getState().user;
      
      if (!user) throw new Error('User not authenticated');

      // Ensure duration is between 1 and 120 minutes
      const validDuration = Math.max(1, Math.min(120, durationInMinutes));
      const durationInSeconds = validDuration * 60;

      const session = {
        user_id: user.id,
        task_id: taskId,
        duration: durationInSeconds,
        completed: false,
      };

      const { data, error } = await supabase
        .from('focus_sessions')
        .insert(session)
        .select()
        .single();

      if (error) throw error;

      // Clear any existing timers
      get().clearTimers();

      // Start the focus timer
      const focusTimer = setInterval(() => {
        const { timeLeft, isActive } = get();
        if (isActive && timeLeft > 0) {
          set({ timeLeft: timeLeft - 1 });
        }
      }, 1000);

      set({ 
        currentSession: data,
        timeLeft: durationInSeconds,
        isActive: true,
        error: null,
        focusTimer
      });

      await get().fetchSessions();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  endSession: async (completed: boolean) => {
    try {
      const { currentSession, timeLeft } = get();
      if (!currentSession) return;

      set({ loading: true, error: null });
      const user = useAuthStore.getState().user;
      
      if (!user) throw new Error('User not authenticated');

      const actualDuration = Math.max(currentSession.duration - timeLeft, 0);
      const minutesSpent = Math.floor(actualDuration / 60);

      // Update session in database
      const { data: updatedSession, error } = await supabase
        .from('focus_sessions')
        .update({ 
          completed,
          duration: actualDuration,
          end_time: new Date().toISOString()
        })
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) throw error;

      // Update local sessions list and stats
      const sessions = get().sessions;
      const updatedSessions = sessions.map(s => 
        s.id === currentSession.id ? updatedSession : s
      );

      const completedSessions = updatedSessions.filter(s => s.completed);
      const totalMinutes = completedSessions.reduce((acc, session) => 
        acc + Math.floor(session.duration / 60), 0);

      // Update user statistics
      const { updateStats } = useStatisticsStore.getState();
      await updateStats({
        total_focus_minutes: totalMinutes,
        total_sessions: completedSessions.length,
        last_session_date: new Date().toISOString()
      });

      // Award coins if session was completed (with daily limit)
      if (completed) {
        const today = new Date().toISOString().split('T')[0];
        
        // Get coins earned today
        const { data: todayCoins } = await supabase
          .from('daily_coins')
          .select('coins_earned')
          .eq('user_id', user.id)
          .eq('date', today)
          .single();

        const coinsEarnedToday = todayCoins?.coins_earned || 0;
        const remainingCoins = Math.max(0, DAILY_COIN_LIMIT - coinsEarnedToday);
        const coinsToAward = Math.min(minutesSpent, remainingCoins);

        if (coinsToAward > 0) {
          const { addCoins } = useCoinsStore.getState();
          await addCoins(coinsToAward);

          // Update daily coins record
          await supabase
            .from('daily_coins')
            .upsert({
              user_id: user.id,
              date: today,
              coins_earned: coinsEarnedToday + coinsToAward,
              updated_at: new Date().toISOString()
            });
        }

        // Update achievements with actual minutes focused, regardless of coins earned
        const { updateProgress } = useAchievementsStore.getState();
        await updateProgress({
          focusMinutes: minutesSpent,
          sessions: 1,
          coinsEarned: coinsToAward
        });
      }

      set({ 
        currentSession: null,
        timeLeft: 0,
        isActive: false,
        sessions: updatedSessions,
        totalMinutes,
        totalSessions: completedSessions.length,
        loading: false
      });

      // Fetch sessions again to ensure we have the latest data
      await get().fetchSessions();

    } catch (error: any) {
      console.error('Error ending session:', error);
      set({ error: error.message, loading: false });
    }
  },

  startBreak: () => {
    // Clear any existing timers
    get().clearTimers();

    set({ 
      timeLeft: BREAK_DURATION,
      isBreak: true,
      isActive: true 
    });

    const timer = setInterval(() => {
      const { timeLeft, isActive, isBreak } = get();
      if (isActive && timeLeft > 0) {
        set({ timeLeft: timeLeft - 1 });
      } else if (timeLeft === 0 && isBreak) {
        // Just stop the timer without auto-skipping
        clearInterval(timer);
        set({ 
          isActive: false,
          breakTimer: undefined
        });
      }
    }, 1000);

    set({ breakTimer: timer });
  },

  skipBreak: () => {
    get().clearTimers();
    set({ 
      isBreak: false,
      isActive: false,
      timeLeft: 0
    });
  },

  clearTimers: () => {
    const { breakTimer, focusTimer } = get();
    if (breakTimer) {
      clearInterval(Number(breakTimer));
    }
    if (focusTimer) {
      clearInterval(Number(focusTimer));
    }
    set({ breakTimer: undefined, focusTimer: undefined });
  },

  pauseSession: () => {
    const { focusTimer } = get();
    if (focusTimer) {
      clearInterval(Number(focusTimer));
      set({ focusTimer: undefined });
    }
    set({ isActive: false });
  },

  resumeSession: () => {
    const { isBreak } = get();
    
    // Clear any existing timers
    get().clearTimers();

    const timer = setInterval(() => {
      const { timeLeft, isActive } = get();
      if (isActive && timeLeft > 0) {
        set({ timeLeft: timeLeft - 1 });
      }
    }, 1000);

    set({ 
      isActive: true,
      [isBreak ? 'breakTimer' : 'focusTimer']: timer
    });
  },

  fetchSessions: async () => {
    try {
      set({ loading: true, error: null });
      const user = useAuthStore.getState().user;
      
      if (!user) throw new Error('User not authenticated');

      // Fetch all focus sessions for the user
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate total minutes and sessions
      const completedSessions = data?.filter(s => s.completed) || [];
      const totalMinutes = completedSessions.reduce((acc, session) => 
        acc + Math.floor(session.duration / 60), 0);

      set({ 
        sessions: data || [],
        totalMinutes,
        totalSessions: completedSessions.length,
        loading: false,
        error: null
      });

      // Update achievements
      const { updateProgress } = useAchievementsStore.getState();
      await updateProgress({
        focusMinutes: totalMinutes,
        sessions: completedSessions.length
      });

    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      set({ error: error.message, loading: false });
    }
  },
})); 