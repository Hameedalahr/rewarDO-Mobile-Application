export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  notifications?: boolean;
  focus_mode_settings?: {
    default_session_duration?: number;
    break_duration?: number;
    notification_sound?: boolean;
  };
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (credentials: { email: string; password: string; full_name: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: { full_name?: string; avatar_url?: string }) => Promise<void>;
  updateUserPreferences: (preferences: UserPreferences) => Promise<void>;
} 