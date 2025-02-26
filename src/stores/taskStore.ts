import { create } from 'zustand';
import { TaskStore, Task } from '../types/task';
import { supabase } from '../services/supabase/supabaseClient';
import { useAuthStore } from './authStore';
import { useAchievementsStore } from './achievementsStore';

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    try {
      set({ loading: true, error: null });
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ tasks: data as Task[] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addTask: async (task) => {
    try {
      set({ loading: true, error: null });
      const user = useAuthStore.getState().user;
      
      if (!user) throw new Error('User not authenticated');

      const newTask = {
        ...task,
        user_id: user.id,
        created_at: new Date().toISOString(),
        completed: false
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        throw error;
      }

      set(state => ({ 
        tasks: [data as Task, ...state.tasks],
        error: null 
      }));

      return data;
    } catch (error: any) {
      console.error('Task addition error:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTask: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        tasks: state.tasks.map((task) => 
          task.id === id ? { ...task, ...data } : task
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  deleteTask: async (id) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  toggleComplete: async (taskId: string) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        tasks: state.tasks.map((task) => 
          task.id === taskId ? { ...task, ...data } : task
        ),
      }));

      if (data.completed) {
        const { updateProgress } = useAchievementsStore.getState();
        await updateProgress({
          tasksCompleted: 1
        });
      }
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
})); 