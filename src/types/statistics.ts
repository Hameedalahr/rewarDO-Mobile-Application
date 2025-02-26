export interface DailyStats {
  date: string;
  total_focus_time: number;
  completed_sessions: number;
  total_sessions: number;
}

export interface StatisticsStore {
  dailyStats: DailyStats[];
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
  updateStats: (sessionData: {
    duration: number;
    completed: boolean;
  }) => Promise<void>;
} 