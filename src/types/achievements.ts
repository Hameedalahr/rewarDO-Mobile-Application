export type AchievementType = 
  | 'sessions' 
  | 'focus_time' 
  | 'streak' 
  | 'single_session'
  | 'morning_session'
  | 'weekend_sessions'
  | 'daily_sessions';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  type: AchievementType;
  unlocked: boolean;
  progress: number;
}

export interface AchievementsStore {
  achievements: Achievement[];
  currentStreak: number;
  longestStreak: number;
  loading: boolean;
  error: string | null;
  notification: {
    achievement: Achievement | null;
    visible: boolean;
  };
  showNotification: (achievement: Achievement) => void;
  hideNotification: () => void;
  fetchAchievements: () => Promise<void>;
  updateAchievements: (sessionData: {
    duration: number;
    completed: boolean;
  }) => Promise<void>;
} 