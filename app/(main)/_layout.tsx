import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useCoinsStore } from '../../src/stores/coinsStore';

export default function MainLayout() {
  const { user } = useAuthStore();
  const { coins, fetchCoins } = useCoinsStore();

  // Fetch coins when the app loads
  useEffect(() => {
    fetchCoins();
  }, []);

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 0,
            elevation: 0,
            height: 60,
          },
          tabBarActiveTintColor: '#6200ee',
          tabBarInactiveTintColor: '#666',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="focus/index"
          options={{
            tabBarLabel: 'Focus',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="timer" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="store/index"
          options={{
            tabBarLabel: 'Store',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="store" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="achievements/index"
          options={{
            tabBarLabel: 'Rewards',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="trophy" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats/index"
          options={{
            tabBarLabel: 'Stats',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chart-bar" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings/index"
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account" color={color} size={size} />
            ),
          }}
        />
        
        {/* Hidden screens */}
        <Tabs.Screen
          name="tasks/[id]"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="tasks/new"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="focus/history"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="settings/purchase-history"
          options={{ href: null }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
} 