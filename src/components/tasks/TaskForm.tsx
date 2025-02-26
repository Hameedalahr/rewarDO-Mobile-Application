import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { TextInput, Button, Card, Text, SegmentedButtons, Portal, Dialog, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTasksStore } from '../../stores/tasksStore';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

export default function TaskForm() {
  const router = useRouter();
  const { addTask } = useTasksStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = async () => {
    try {
      await addTask({
        title,
        description,
        priority,
        due_date: dueDate?.toISOString() || null,
        completed: false,
      });
      router.back();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const getPriorityColor = (value: string) => {
    switch (value) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'high': return '#f44336';
      default: return '#666';
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6200ee', '#9c27b0']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <IconButton 
            icon="close" 
            iconColor="#fff" 
            size={24}
            onPress={() => router.back()}
          />
          <Text variant="headlineSmall" style={styles.headerTitle}>New Task</Text>
          <IconButton 
            icon="check" 
            iconColor="#fff"
            size={24}
            onPress={handleSubmit}
            disabled={!title.trim()}
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Surface style={styles.inputCard}>
          <TextInput
            label="Task Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
            placeholder="What needs to be done?"
            right={<TextInput.Icon icon="format-title" />}
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
            placeholder="Add details about your task..."
            right={<TextInput.Icon icon="text" />}
          />
        </Surface>

        <Surface style={styles.optionsCard}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Priority Level</Text>
          <View style={styles.priorityContainer}>
            {['low', 'medium', 'high'].map((value) => (
              <Button
                key={value}
                mode={priority === value ? 'contained' : 'outlined'}
                onPress={() => setPriority(value)}
                style={[
                  styles.priorityButton,
                  { borderColor: getPriorityColor(value) },
                  priority === value && { backgroundColor: getPriorityColor(value) }
                ]}
                labelStyle={priority !== value && { color: getPriorityColor(value) }}
                icon={value === 'low' ? 'flag-outline' : 'flag'}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </Button>
            ))}
          </View>

          <Text variant="titleMedium" style={styles.sectionTitle}>Due Date</Text>
          <Button 
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            icon="calendar"
            style={styles.dateButton}
          >
            {dueDate ? dueDate.toLocaleDateString() : 'Add Due Date'}
          </Button>
        </Surface>
      </ScrollView>

      {showDatePicker && (
        Platform.OS === 'ios' ? (
          <Portal>
            <Dialog visible={showDatePicker} onDismiss={() => setShowDatePicker(false)}>
              <Dialog.Title>Select Due Date</Dialog.Title>
              <Dialog.Content>
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  style={styles.datePicker}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDueDate(undefined)}>Clear</Button>
                <Button onPress={() => setShowDatePicker(false)}>Done</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        ) : (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            onChange={handleDateChange}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  inputCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#fff',
  },
  optionsCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  priorityButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateButton: {
    marginBottom: 8,
  },
  datePicker: {
    width: '100%',
    height: 200,
  },
}); 