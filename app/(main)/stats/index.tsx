import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { Text, Card, Divider, List, Surface, ProgressBar, Portal } from 'react-native-paper';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useStatisticsStore } from '../../../src/stores/statisticsStore';
import { useTasksStore } from '../../../src/stores/tasksStore';
import { useFocusStore } from '../../../src/stores/focusStore';
import { useAchievementsStore } from '../../../src/stores/achievementsStore';
import GradientHeader from '../../../src/components/common/GradientHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const BAR_WIDTH = (width - 64) / 7;
const MAX_BAR_HEIGHT = 150;

const getLastSevenDays = () => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
};

const Bar = React.memo(({ 
  date, 
  minutes, 
  maxMinutes,
  onPress 
}: { 
  date: string; 
  minutes: number; 
  maxMinutes: number;
  onPress: () => void;
}) => {
  const height = (minutes / maxMinutes) * MAX_BAR_HEIGHT;
  const displayDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
  const isToday = new Date(date).toDateString() === new Date().toDateString();

  const animatedStyle = useAnimatedStyle(() => ({
    height: withSpring(height || 0, {
      damping: 15,
      stiffness: 100
    }),
  }));

  return (
    <TouchableOpacity 
      style={styles.barContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.bar, animatedStyle, isToday && styles.todayBar]}>
        {minutes > 0 && (
          <Text style={styles.barText}>{minutes}m</Text>
        )}
      </Animated.View>
      <Text style={[styles.dateText, isToday && styles.todayText]}>{displayDate}</Text>
    </TouchableOpacity>
  );
});

export default function StatsScreen() {
  const { sessions, fetchSessions, totalMinutes, totalSessions } = useFocusStore();
  const { stats, fetchStats } = useStatisticsStore();
  const { currentStreak, longestStreak } = useAchievementsStore();
  const { tasks } = useTasksStore();
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<{
    date: string;
    minutes: number;
    sessions: number;
  } | null>(null);

  const dailyStats = useMemo(() => {
    const last7Days = getLastSevenDays();
    
    return last7Days.map(date => {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const daySessions = sessions.filter(session => {
        if (!session.created_at) return false;
        try {
          const sessionDate = new Date(session.created_at);
          return sessionDate >= dayStart && 
                 sessionDate < dayEnd && 
                 session.completed;
        } catch (error) {
          console.warn('Invalid session date:', session.created_at);
          return false;
        }
      });

      const totalMinutes = daySessions.reduce((acc, session) => {
        const duration = session.duration || 0;
        return acc + Math.floor(duration / 60);
      }, 0);

      return {
        date,
        minutes: totalMinutes,
        sessions: daySessions.length
      };
    });
  }, [sessions]);

  const maxMinutes = useMemo(() => 
    Math.max(...dailyStats.map(stat => stat.minutes), 60),
    [dailyStats]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSessions(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchSessions, fetchStats]);

  useEffect(() => {
    loadData();
    const refreshInterval = setInterval(loadData, 30000);
    return () => clearInterval(refreshInterval);
  }, [loadData]);

  const totalFocusTime = sessions
    .filter(s => s.completed)
    .reduce((acc, s) => {
      const minutes = (s.duration / 60).toFixed(1);
      return acc + parseFloat(minutes);
    }, 0);

  const completionRate = tasks.length > 0 ? 
    (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;

  const progressStats = [
    {
      value: Math.round(completionRate) + '%',
      label: 'Completion',
    },
    {
      value: totalFocusTime.toFixed(1),
      label: 'Minutes Focused',
    },
    {
      value: sessions.filter(s => s.completed).length,
      label: 'Sessions',
    },
  ];

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const achievements = [
    {
      title: 'First Focus',
      description: 'Complete your first focus session',
      icon: 'timer-outline',
      progress: sessions.filter(s => s.completed).length > 0 ? 100 : 0,
    },
    {
      title: 'Focus Master',
      description: 'Complete 10 focus sessions',
      icon: 'timer-check',
      progress: Math.min((sessions.filter(s => s.completed).length / 10) * 100, 100),
    },
    {
      title: 'Hour Champion',
      description: 'Focus for a total of 60 minutes',
      icon: 'clock-check',
      progress: Math.min((totalFocusTime / 60) * 100, 100),
    },
  ];

  const handleBarPress = useCallback((date: string) => {
    const dayStats = dailyStats.find(stat => stat.date === date);
    if (dayStats) {
      setSelectedDay({
        date,
        minutes: dayStats.minutes,
        sessions: dayStats.sessions
      });
    }
  }, [dailyStats]);

  const renderDailyBar = ({ date, minutes, label }) => {
    const barHeight = Math.max((minutes / maxMinutes) * 200, 4); // Minimum bar height of 4

    return (
      <View style={styles.barContainer}>
        {/* Time label above bar */}
        <Text style={[
          styles.timeLabel, 
          minutes > 0 ? styles.activeDayTime : styles.inactiveDayTime
        ]}>
          {minutes > 0 ? `${minutes}m` : ''}
        </Text>
        
        {/* Bar */}
        <View style={[styles.barWrapper, { height: 200 }]}>
          <LinearGradient
            colors={minutes > 0 ? ['#8A2BE2', '#9400D3'] : ['#E0E0E0', '#E0E0E0']}
            style={[styles.bar, { height: barHeight }]}
          />
        </View>
        
        {/* Day label below bar */}
        <Text style={styles.dayLabel}>{label}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#6200ee', '#9c27b0']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerSubtitle}>Track your productivity journey</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsGrid}>
          <Surface style={styles.statCard}>
            <MaterialCommunityIcons name="fire" size={32} color="#FF9800" />
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
            <Text style={styles.statSubtext}>Best: {longestStreak}</Text>
          </Surface>

          <Surface style={styles.statCard}>
            <MaterialCommunityIcons name="clock-outline" size={32} color="#4CAF50" />
            <Text style={styles.statValue}>{totalMinutes}</Text>
            <Text style={styles.statLabel}>Minutes Focused</Text>
            <Text style={styles.statSubtext}>Total Time</Text>
          </Surface>

          <Surface style={styles.statCard}>
            <MaterialCommunityIcons name="timer" size={32} color="#2196F3" />
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
            <Text style={styles.statSubtext}>Completed</Text>
          </Surface>
        </View>

        <Surface style={styles.chartCard}>
          <Text style={styles.chartTitle}>Daily Focus Time</Text>
          <View style={styles.chartContainer}>
            {dailyStats.map((stat, index) => renderDailyBar({
              date: stat.date,
              minutes: stat.minutes,
              label: new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short' })
            }))}
          </View>
        </Surface>

        <Surface style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>
            <MaterialCommunityIcons name="lightbulb-outline" size={24} color="#6200ee" /> 
            Insights
          </Text>
          <View style={styles.insightItem}>
            <MaterialCommunityIcons name="trending-up" size={20} color="#4CAF50" />
            <Text style={styles.insightText}>
              {currentStreak > 0 
                ? `You're on a ${currentStreak} day streak! Keep it up!` 
                : "Start a new streak today!"}
            </Text>
          </View>
          <View style={styles.insightItem}>
            <MaterialCommunityIcons name="clock-check" size={20} color="#2196F3" />
            <Text style={styles.insightText}>
              {totalMinutes > 0 
                ? `You've focused for ${totalMinutes} minutes in total` 
                : "Complete your first focus session"}
            </Text>
          </View>
        </Surface>
      </View>

      <Portal>
        <Modal
          visible={!!selectedDay}
          onDismiss={() => setSelectedDay(null)}
          transparent
        >
          <View style={styles.modalContainer}>
            <Surface style={styles.modalContent}>
              {selectedDay && (
                <>
                  <Text style={styles.modalTitle}>
                    {new Date(selectedDay.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  <View style={styles.modalStats}>
                    <View style={styles.modalStatItem}>
                      <MaterialCommunityIcons name="clock-outline" size={24} color="#6200ee" />
                      <Text style={styles.modalStatValue}>{selectedDay.minutes}</Text>
                      <Text style={styles.modalStatLabel}>Minutes Focused</Text>
                    </View>
                    <View style={styles.modalStatItem}>
                      <MaterialCommunityIcons name="check-circle-outline" size={24} color="#4CAF50" />
                      <Text style={styles.modalStatValue}>{selectedDay.sessions}</Text>
                      <Text style={styles.modalStatLabel}>Sessions Completed</Text>
                    </View>
                </View>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setSelectedDay(null)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
              </Surface>
          </View>
        </Modal>
      </Portal>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    margin: 4,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  chartCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 2,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#6200ee',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 20,
    height: 280, // Increased to accommodate time labels
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    width: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 12,
  },
  timeLabel: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  activeDayTime: {
    color: '#6200ee',
  },
  inactiveDayTime: {
    color: 'transparent', // Hide time for days with 0 minutes
  },
  dayLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  insightsCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#6200ee',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  insightText: {
    marginLeft: 12,
    color: '#333',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    padding: 20,
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
    marginVertical: 8,
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#6200ee',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 