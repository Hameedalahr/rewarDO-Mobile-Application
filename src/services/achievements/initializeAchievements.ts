import { supabase } from '../supabase/supabaseClient';

export const defaultAchievements = [
  {
    title: 'First Focus',
    description: 'Complete your first focus session',
    icon: 'timer-check',
    type: 'focus',
    requirement: 1,
    reward: 10,
    reward_claimed: false
  },
  {
    title: 'Focus Master',
    description: 'Complete 10 focus sessions',
    icon: 'timer-star',
    type: 'sessions',
    requirement: 10,
    reward: 50,
    reward_claimed: false
  },
  {
    title: 'Deep Worker',
    description: 'Accumulate 120 minutes of focus time',
    icon: 'clock-check',
    type: 'focus_time',
    requirement: 120,
    reward: 30,
    reward_claimed: false
  },
  {
    title: 'Task Champion',
    description: 'Complete 15 tasks',
    icon: 'check-circle',
    type: 'task',
    requirement: 15,
    reward: 40,
    reward_claimed: false
  },
  {
    title: 'Consistency King',
    description: 'Maintain a 5-day focus streak',
    icon: 'calendar-check',
    type: 'streak',
    requirement: 5,
    reward: 100,
    reward_claimed: false
  },
  {
    title: 'Productivity Pro',
    description: 'Complete 5 tasks in a single day',
    icon: 'rocket',
    type: 'daily_tasks',
    requirement: 5,
    reward: 25,
    reward_claimed: false
  },
  {
    title: 'Focus Warrior',
    description: 'Complete a 45-minute focus session',
    icon: 'timer-star',
    type: 'focus_time',
    requirement: 45,
    reward: 20,
    reward_claimed: false
  },
  {
    title: 'Early Bird',
    description: 'Complete a focus session before 9 AM',
    icon: 'weather-sunny',
    type: 'milestone',
    requirement: 1,
    reward: 15,
    reward_claimed: false
  },
  {
    title: 'Weekend Warrior',
    description: 'Complete 3 focus sessions on a weekend',
    icon: 'calendar-weekend',
    type: 'milestone',
    requirement: 3,
    reward: 30,
    reward_claimed: false
  },
  {
    title: 'Task Master',
    description: 'Complete 50 tasks total',
    icon: 'trophy',
    type: 'task',
    requirement: 50,
    reward: 150,
    reward_claimed: false
  },
  {
    title: 'Focus Legend',
    description: 'Accumulate 500 minutes of focus time',
    icon: 'crown',
    type: 'focus_time',
    requirement: 500,
    reward: 200,
    reward_claimed: false
  },
  {
    title: 'Streak Master',
    description: 'Maintain a 10-day focus streak',
    icon: 'fire',
    type: 'streak',
    requirement: 10,
    reward: 250,
    reward_claimed: false
  }
];

export const initializeUserAchievements = async (userId: string) => {
  try {
    // Check if user already has achievements
    const { data: existingAchievements } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', userId);

    if (existingAchievements && existingAchievements.length > 0) {
      return; // User already has achievements
    }

    // Create achievements for new user
    const achievementsToInsert = defaultAchievements.map(achievement => ({
      ...achievement,
      user_id: userId,
      progress: 0,
      completed: false,
      current_value: 0,
      reward_claimed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('achievements')
      .insert(achievementsToInsert);

    if (error) throw error;

  } catch (error) {
    console.error('Error initializing achievements:', error);
    throw error;
  }
}; 