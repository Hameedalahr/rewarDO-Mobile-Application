import { create } from 'zustand';
import { aiHelpers } from '../services/ai/deepseekClient';
import { useTasksStore } from './tasksStore';
import { useFocusStore } from './focusStore';
import { supabase } from '../services/supabase/supabaseClient';

interface Task {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
}

interface AIStore {
  insights: string | null;
  loading: boolean;
  error: string | null;
  isAvailable: boolean;
  generateTaskPriorities: () => Promise<void>;
  analyzeFocusTime: () => Promise<void>;
  generateInsights: () => Promise<void>;
  generateResponse: (input: string, tasks: Task[]) => Promise<string>;
  extractTasks: (input: string) => Promise<Task[]>;
}

export const useAIStore = create<AIStore>((set) => {
  // Check if AI service is available
  const isAvailable = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY !== undefined;
  
  return {
    insights: null,
    loading: false,
    error: null,
    isAvailable,

    generateTaskPriorities: async () => {
      if (!isAvailable) {
        set({ error: 'AI features are not available' });
        return;
      }

      try {
        set({ loading: true, error: null });
        const tasks = useTasksStore.getState().tasks;
        const priorities = await aiHelpers.suggestTaskPriorities(tasks);
        set({ insights: priorities });
      } catch (error: any) {
        set({ error: error.message });
        console.warn('Failed to generate task priorities:', error);
      } finally {
        set({ loading: false });
      }
    },

    analyzeFocusTime: async () => {
      if (!isAvailable) {
        set({ error: 'AI features are not available' });
        return;
      }

      try {
        set({ loading: true, error: null });
        const sessions = useFocusStore.getState().sessions;
        const analysis = await aiHelpers.analyzeFocusPatterns(sessions);
        set({ insights: analysis });
      } catch (error: any) {
        set({ error: error.message });
        console.warn('Failed to analyze focus time:', error);
      } finally {
        set({ loading: false });
      }
    },

    generateInsights: async () => {
      if (!isAvailable) {
        set({ error: 'AI features are not available' });
        return;
      }

      try {
        set({ loading: true, error: null });
        const tasks = useTasksStore.getState().tasks;
        const sessions = useFocusStore.getState().sessions;
        
        const userData = {
          tasks,
          sessions,
        };

        const insights = await aiHelpers.generateProductivityInsights(userData);
        set({ insights });
      } catch (error: any) {
        set({ error: error.message });
        console.warn('Failed to generate insights:', error);
      } finally {
        set({ loading: false });
      }
    },

    generateResponse: async (input: string, tasks: Task[]) => {
      if (!isAvailable) {
        return 'AI features are not available. Please configure the AI service to get personalized responses.';
      }

      try {
        set({ loading: true });
        const taskList = tasks.map(t => `- ${t.title}`).join('\n');
        const response = await aiHelpers.generateAIResponse([
          {
            role: 'system',
            content: 'You are a productivity AI assistant.'
          },
          {
            role: 'user',
            content: `Given these tasks:\n${taskList}\n\n${input}`
          }
        ]);
        return response;
      } catch (error: any) {
        console.warn('Failed to generate AI response:', error);
        return 'Sorry, I encountered an error. Please try again later.';
      } finally {
        set({ loading: false });
      }
    },

    extractTasks: async (input: string) => {
      if (!isAvailable) {
        throw new Error('AI features are not available');
      }

      try {
        set({ loading: true });
        return await aiHelpers.parseTasksFromText(input);
      } catch (error: any) {
        console.warn('Failed to extract tasks:', error);
        throw error;
      } finally {
        set({ loading: false });
      }
    },
  };
}); 