export interface FocusSession {
  id: string;
  user_id: string;
  task_id: string;
  created_at: string;
  end_time?: string;
  duration: number;
  completed: boolean;
  notes?: string;
}

export interface FocusStore {
  currentSession: FocusSession | null;
  sessions: FocusSession[];
  loading: boolean;
  error: string | null;
  timeLeft: number;
  isActive: boolean;
  isBreak: boolean;
  breakTimer?: NodeJS.Timer;
  focusTimer?: NodeJS.Timer;
  startSession: (taskId: string, duration: number) => Promise<void>;
  endSession: (completed: boolean) => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  fetchSessions: () => Promise<void>;
  startBreak: () => void;
  skipBreak: () => void;
  clearTimers: () => void;
}