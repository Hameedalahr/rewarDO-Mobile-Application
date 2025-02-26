import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { Text, FAB, Surface, useTheme, IconButton, Card, Portal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTasksStore } from '../../src/stores/tasksStore';
import { useAuthStore } from '../../src/stores/authStore';
import TaskList from '../../src/components/tasks/TaskList';
import TaskFilters from '../../src/components/tasks/TaskFilters';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAIStore } from '../../src/stores/aiStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCoinsStore } from '../../src/stores/coinsStore';
import AIChatBox from '../../src/components/ai/AIChatBox';
import NewTaskSheet from '../../src/components/tasks/NewTaskSheet';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const theme = useTheme();
  const router = useRouter();
  const { fetchTasks, tasks } = useTasksStore();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const { insights, generateTaskPriorities } = useAIStore();
  const { coins, fetchCoins } = useCoinsStore();
  const [showAIChat, setShowAIChat] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showCoinInfo, setShowCoinInfo] = useState(false);

  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    weekday: 'long' 
  };
  const dateString = today.toLocaleDateString('en-US', dateOptions);

  // Calculate task statistics
  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    today: tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate.toDateString() === today.toDateString();
    }).length,
  }), [tasks]);

  useEffect(() => {
    fetchTasks();
    fetchCoins();
  }, []);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply filters
    switch (filter) {
      case 'today':
        filtered = filtered.filter(task => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          return dueDate.toDateString() === today.toDateString();
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(task => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          return dueDate > today;
        });
        break;
      case 'completed':
        filtered = filtered.filter(task => task.completed);
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'priority':
          const priorityMap = { high: 3, medium: 2, low: 1 };
          return (priorityMap[b.priority || 'low'] || 0) - (priorityMap[a.priority || 'low'] || 0);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, filter, sortBy]);

  return (
    <View style={styles.container}>
      <ScrollView>
        <LinearGradient
          colors={['#6200ee', '#9c27b0']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName}>{user?.full_name}</Text>
                <Text style={styles.date}>{dateString}</Text>
              </View>
              <View style={styles.coinsContainer}>
                <MaterialCommunityIcons 
                  name="star-circle"
                  size={20} 
                  color="#FFD700" 
                  style={styles.coinIcon}
                />
                <Text style={styles.coinsText}>{coins}</Text>
                <TouchableOpacity onPress={() => setShowCoinInfo(true)}>
                  <MaterialCommunityIcons 
                    name="help-circle-outline"
                    size={20} 
                    color="#fff" 
                    style={styles.helpIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.statsContainer}>
              <Surface style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Tasks</Text>
              </Surface>
              <Surface style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </Surface>
              <Surface style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.today}</Text>
                <Text style={styles.statLabel}>Due Today</Text>
              </Surface>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <TaskFilters
            selectedFilter={filter}
            onFilterChange={setFilter}
            selectedSort={sortBy}
            onSortChange={setSortBy}
          />
          
          <TaskList tasks={filteredAndSortedTasks} />

          
        </View>
      </ScrollView>

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fabButton, styles.topFab]}
          onPress={() => setShowAIChat(true)}
        >
          <MaterialCommunityIcons 
            name="robot" 
            size={24} 
            color="#fff"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => setShowNewTask(true)}
        >
          <MaterialCommunityIcons 
            name="plus" 
            size={24} 
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <AIChatBox 
        visible={showAIChat}
        onDismiss={() => setShowAIChat(false)}
      />
      
      <NewTaskSheet
        visible={showNewTask}
        onDismiss={() => setShowNewTask(false)}
      />

      <Portal>
        <Modal
          visible={showCoinInfo}
          onDismiss={() => setShowCoinInfo(false)}
          transparent
        >
          <View style={styles.modalContainer}>
            <Surface style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="star-circle" size={24} color="#FFD700" />
                <Text style={styles.modalTitle}>Coin System</Text>
                <IconButton 
                  icon="close" 
                  size={20} 
                  onPress={() => setShowCoinInfo(false)} 
                />
              </View>
              <View style={styles.modalBody}>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="timer" size={20} color="#6200ee" />
                  <Text style={styles.infoText}>
                    Earn 1 coin for every minute spent in focus sessions
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="calendar-clock" size={20} color="#6200ee" />
                  <Text style={styles.infoText}>
                    Daily limit: Maximum 100 coins per day
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="store" size={20} color="#6200ee" />
                  <Text style={styles.infoText}>
                    Redeem coins in the store for products and vouchers
                  </Text>
                </View>
              </View>
            </Surface>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerGradient: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '400',
    marginTop: 10,
  },
  userName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginTop: -0,
  },
  date: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 0,
    fontWeight: '400',
  },
  statsContainer
  : {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
    textAlign: 'center',
  },
  statLabel: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#f5f5f5',
    minHeight: 600,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    alignItems: 'center',
  },
  fabButton: {
    backgroundColor: '#6200ee',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  topFab: {
    marginBottom: 16,
  },
  insightsCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightsTitle: {
    marginLeft: 8,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  coinIcon: {
    marginRight: 4,
  },
  coinsText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpIcon: {
    marginLeft: 4,
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
    flex: 1,
    marginLeft: 12,
  },
  modalBody: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    color: '#333',
    fontSize: 14,
  },
}); 