import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, TextInput, Portal, Dialog, FAB, Card, IconButton, Chip } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTasksStore } from '../../../src/stores/tasksStore';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
// import DateTimePicker from '@react-native-community/datetimepicker';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { tasks, updateTask, deleteTask } = useTasksStore();
  const task = tasks.find(t => t.id === id);

  // Reset edited task state when task changes
  useEffect(() => {
    if (task) {
      setEditMode(false);
      setEditedTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        due_date: task.due_date ? new Date(task.due_date) : null
      });
    }
  }, [task?.id]); // Only run when task id changes

  const [editMode, setEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? new Date(task?.due_date) : null
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (!task) {
    return (
      <View style={styles.container}>
        <Text>Task not found</Text>
      </View>
    );
  }

  const handleUpdate = async () => {
    try {
      // Convert Date to ISO string for the API
      const updates = {
        ...editedTask,
        due_date: editedTask.due_date?.toISOString() || null
      };
      await updateTask(task.id, updates);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      router.back();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF5252';
      case 'medium': return '#FFC107';
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEditedTask(prev => ({ ...prev, due_date: selectedDate }));
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'No due date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6200ee', '#9c27b0']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            iconColor="#fff"
            size={24}
            onPress={() => router.back()}
          />
          <Text style={styles.headerTitle}>Task Details</Text>
          <View style={styles.headerActions}>
            <IconButton
              icon="delete"
              iconColor="#fff"
              size={24}
              onPress={() => setShowDeleteDialog(true)}
            />
            <IconButton
              icon={editMode ? "check" : "pencil"}
              iconColor="#fff"
              size={24}
              onPress={() => {
                if (editMode) {
                  handleUpdate();
                } else {
                  setEditMode(true);
                }
              }}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Card style={styles.taskCard}>
          {editMode ? (
            <Card.Content>
              <TextInput
                label="Title"
                value={editedTask.title}
                onChangeText={title => setEditedTask(prev => ({ ...prev, title }))}
                style={styles.input}
                mode="outlined"
                placeholder={task.title}
              />
              <TextInput
                label="Description"
                value={editedTask.description}
                onChangeText={description => setEditedTask(prev => ({ ...prev, description }))}
                multiline
                numberOfLines={4}
                style={styles.input}
                mode="outlined"
                placeholder={task.description}
              />

              {/* Due Date Section */}
              <View style={styles.dateContainer}>
                <Text style={styles.sectionLabel}>Due Date:</Text>
                <View style={styles.dateRow}>
                  <Text style={styles.dateText}>
                    {formatDate(editedTask.due_date)}
                  </Text>
                  <View style={styles.dateButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowDatePicker(true)}
                      icon="calendar"
                      style={styles.dateButton}
                    >
                      Change Date
                    </Button>
                    {editedTask.due_date && (
                      <Button
                        mode="outlined"
                        onPress={() => setEditedTask(prev => ({ ...prev, due_date: null }))}
                        icon="calendar-remove"
                        textColor="#FF5252"
                        style={styles.dateButton}
                      >
                        Clear
                      </Button>
                    )}
                  </View>
                </View>
              </View>

              {/* Priority Section */}
              <View style={styles.priorityContainer}>
                <Text style={styles.sectionLabel}>Priority:</Text>
                <View style={styles.priorityButtons}>
                  {['low', 'medium', 'high'].map(priority => (
                    <Chip
                      key={priority}
                      selected={editedTask.priority === priority}
                      onPress={() => setEditedTask(prev => ({ ...prev, priority: priority as 'low' | 'medium' | 'high' }))}
                      style={[
                        styles.priorityChip,
                        { backgroundColor: editedTask.priority === priority ? getPriorityColor(priority) : '#f0f0f0' }
                      ]}
                      textStyle={{ color: editedTask.priority === priority ? '#fff' : '#000' }}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>
            </Card.Content>
          ) : (
            <Card.Content>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Chip
                style={[styles.priorityChip, { backgroundColor: getPriorityColor(task.priority) }]}
                textStyle={{ color: '#fff' }}
              >
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
              </Chip>
              <Text style={styles.taskDescription}>{task.description}</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
                  <Text style={styles.statText}>
                    Created: {new Date(task.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {task.due_date && (
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="calendar" size={20} color="#666" />
                    <Text style={styles.statText}>
                      Due: {formatDate(new Date(task.due_date))}
                    </Text>
                  </View>
                )}
                {task.completed && (
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color="#4CAF50" />
                    <Text style={[styles.statText, { color: '#4CAF50' }]}>
                      Completed: {new Date(task.completed_at || '').toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </Card.Content>
          )}
        </Card>
      </ScrollView>

      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Task</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this task?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDelete} textColor="#FF5252">Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Date Picker Dialog */}
      {/* Uncomment this section when ready to use DateTimePicker
      {showDatePicker && (
        <DateTimePicker
          value={editedTask.due_date || new Date()}
          mode="date"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  taskCard: {
    borderRadius: 12,
    elevation: 4,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  taskDescription: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    lineHeight: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  priorityContainer: {
    marginTop: 8,
  },
  priorityLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    marginBottom: 12,
  },
  statsContainer: {
    marginTop: 24,
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    color: '#666',
    fontSize: 14,
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButton: {
    borderColor: '#6200ee',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
}); 