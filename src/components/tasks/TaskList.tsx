import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Surface, Text, IconButton, useTheme } from 'react-native-paper';
import { useTasksStore } from '../../stores/tasksStore';
import { useRouter } from 'expo-router';
import { Task } from '../../types/task';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  tasks: Task[];
}

export default function TaskList({ tasks }: Props) {
  const theme = useTheme();
  const { toggleComplete } = useTasksStore();
  const router = useRouter();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const formatDueDate = (date: string) => {
    const dueDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dueDate.toDateString() === today.toDateString()) return 'Today';
    if (dueDate.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return dueDate.toLocaleDateString();
  };

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="playlist-check" size={64} color="#ccc" />
        <Text variant="bodyLarge" style={styles.emptyText}>
          No tasks yet. Add your first task to get started!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {tasks.map((task, index) => (
        <Animated.View 
          key={task.id}
          style={[
            styles.taskCard,
            { transform: [{ scale: 1 }] } // Add animation later
          ]}
        >
          <Surface style={[styles.taskSurface, task.completed && styles.completedTask]}>
            <View style={styles.priorityIndicator}>
              <View 
                style={[
                  styles.priorityDot,
                  { backgroundColor: getPriorityColor(task.priority || 'medium') }
                ]} 
              />
            </View>

            <View style={styles.taskContent}>
              <Text 
                variant="titleMedium" 
                style={[
                  styles.taskTitle,
                  task.completed && styles.completedText
                ]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              
              {task.description && (
                <Text 
                  style={[styles.taskDescription, task.completed && styles.completedText]}
                  numberOfLines={2}
                >
                  {task.description}
                </Text>
              )}

              {task.due_date && (
                <View style={styles.taskMeta}>
                  <MaterialCommunityIcons name="calendar" size={14} color="#666" />
                  <Text style={styles.dueDate}>
                    {formatDueDate(task.due_date)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actions}>
              <IconButton
                icon={task.completed ? 'check-circle' : 'circle-outline'}
                size={24}
                onPress={() => toggleComplete(task.id)}
                iconColor={task.completed ? '#4CAF50' : '#666'}
              />
              <IconButton
                icon="chevron-right"
                size={24}
                onPress={() => router.push(`/tasks/${task.id}`)}
                iconColor="#666"
              />
            </View>
          </Surface>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskSurface: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff',
  },
  completedTask: {
    backgroundColor: '#f8f8f8',
    borderColor: '#eee',
  },
  priorityIndicator: {
    marginRight: 12,
    justifyContent: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskContent: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 16,
    color: '#202020',
  },
  taskDescription: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 