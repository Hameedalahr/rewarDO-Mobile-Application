import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Divider, ActivityIndicator, Surface, IconButton } from 'react-native-paper';
import { useTaskStore } from '../../../src/stores/taskStore';
import { useFocusStore } from '../../../src/stores/focusStore';
import { useTasksStore } from '../../../src/stores/tasksStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function FocusHistoryScreen() {
  const router = useRouter();
  const { tasks } = useTaskStore();
  const { sessions, loading, error, fetchSessions } = useFocusStore();
  const { tasks: tasksStore } = useTasksStore();

  const handleBack = () => {
    router.push('/focus');
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#ff4444" />
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const getTaskName = (taskId: string) => {
    const task = tasksStore.find(t => t.id === taskId);
    return task ? task.title : 'Task not found';
  };

  // Sort sessions by date (most recent first)
  const sortedSessions = [...sessions]
    .filter(session => session.completed)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Calculate total stats
  const totalMinutes = sessions.reduce((acc, session) => acc + session.duration, 0) / 60;
  const completedSessions = sessions.filter(s => s.completed).length;
  const totalCoins = sessions.reduce((acc, session) => acc + Math.floor(session.duration / 60), 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6200ee', '#9c27b0']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              iconColor="#fff"
              size={24}
              onPress={handleBack}
              style={styles.backButton}
            />
            <Text style={styles.headerTitle}>Focus History</Text>
          </View>
          <Text style={styles.headerSubtitle}>Track your focus journey</Text>
        </View>

        <View style={styles.statsContainer}>
          <Surface style={styles.statCard}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#6200ee" />
            <Text style={styles.statValue}>{Math.round(totalMinutes)}</Text>
            <Text style={styles.statLabel}>Minutes Focused</Text>
          </Surface>

          <Surface style={styles.statCard}>
            <MaterialCommunityIcons name="check-circle-outline" size={24} color="#6200ee" />
            <Text style={styles.statValue}>{completedSessions}</Text>
            <Text style={styles.statLabel}>Sessions Completed</Text>
          </Surface>

          <Surface style={styles.statCard}>
            <MaterialCommunityIcons name="star-circle" size={24} color="#6200ee" />
            <Text style={styles.statValue}>{totalCoins}</Text>
            <Text style={styles.statLabel}>Coins Earned</Text>
          </Surface>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {sortedSessions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="timer-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No focus sessions yet</Text>
              <Text style={styles.emptySubtext}>Complete a focus session to see your history</Text>
            </Card.Content>
          </Card>
        ) : (
          sortedSessions.map((session, index) => {
            const taskName = getTaskName(session.task_id);
            return (
              <Card key={session.id} style={styles.sessionCard}>
                <Card.Content>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionDate}>
                        {formatDateTime(session.created_at)}
                      </Text>
                      <Text style={styles.taskTitle}>
                        {taskName}
                      </Text>
                    </View>
                    <View style={styles.coinsContainer}>
                      <MaterialCommunityIcons name="star-circle" size={20} color="#FFD700" />
                      <Text style={styles.coinsText}>
                        {Math.floor(session.duration / 60)}
                      </Text>
                    </View>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="clock-outline" size={20} color="#6200ee" />
                      <Text style={styles.statItemLabel}>Duration</Text>
                      <Text style={styles.statItemValue}>{formatDuration(session.duration)}</Text>
                    </View>

                    <View style={styles.statItem}>
                      <MaterialCommunityIcons 
                        name={session.completed ? "check-circle-outline" : "close-circle-outline"} 
                        size={20} 
                        color={session.completed ? "#4CAF50" : "#FF5252"} 
                      />
                      <Text style={styles.statItemLabel}>Status</Text>
                      <Text style={[
                        styles.statItemValue, 
                        { color: session.completed ? "#4CAF50" : "#FF5252" }
                      ]}>
                        {session.completed ? "Completed" : "Interrupted"}
                      </Text>
                    </View>

                    {session.notes && (
                      <View style={styles.notes}>
                        <MaterialCommunityIcons name="note-text-outline" size={20} color="#666" />
                        <Text style={styles.notesText}>{session.notes}</Text>
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    elevation: 4,
    alignItems: 'center',
    minWidth: 100,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
    marginTop: 8,
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#888',
    marginTop: 8,
  },
  sessionCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
    color: '#666',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 8,
    borderRadius: 16,
    gap: 4,
  },
  coinsText: {
    color: '#666',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statItemLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  statItemValue: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 2,
  },
  notes: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notesText: {
    flex: 1,
    color: '#666',
    fontSize: 14,
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 16,
  },
  backButton: {
    margin: 0,
    marginRight: 8,
  },
}); 