import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { supabase } from '../src/services/supabase/supabaseClient';
import { User } from '../src/types/auth';
import { Provider as PaperProvider } from 'react-native-paper';
import { useCoinsStore } from '../src/stores/coinsStore';
import { initializeUserAchievements } from '../src/services/achievements/initializeAchievements';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { user, setUser, setSession } = useAuthStore();
  const { fetchCoins } = useCoinsStore();

  const transformUser = (supabaseUser: any): User | null => {
    if (!supabaseUser) return null;
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      full_name: supabaseUser.user_metadata?.full_name ?? 'User',
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      preferences: {
        theme: 'light',
        notifications: true,
        focus_mode_settings: {
          default_session_duration: 25,
          break_duration: 5,
          notification_sound: true,
        },
      },
    };
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      const transformedUser = transformUser(session?.user);
      setUser(transformedUser);
      
      if (transformedUser) {
        try {
          await initializeUserAchievements(transformedUser.id);
          await fetchCoins();
        } catch (error) {
          console.error('Error initializing user data:', error);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const transformedUser = transformUser(session?.user);
      setUser(transformedUser);
      
      if (transformedUser) {
        try {
          await initializeUserAchievements(transformedUser.id);
          await fetchCoins();
        } catch (error) {
          console.error('Error initializing user data:', error);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(main)/dashboard');
    }
  }, [user, segments]);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <PaperProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#6200ee' },
          }}
        />
      </PaperProvider>
    </View>
  );
} 