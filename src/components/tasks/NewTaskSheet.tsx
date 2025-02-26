import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, Portal, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTasksStore } from '../../stores/tasksStore';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';

const { height } = Dimensions.get('window');
const SHEET_HEIGHT = height * 0.7;

export default function NewTaskSheet({ visible, onDismiss }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { addTask } = useTasksStore();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: SHEET_HEIGHT,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    await addTask({
      title,
      description,
      due_date: dueDate.toISOString(),
      priority,
    });

    setTitle('');
    setDescription('');
    setDueDate(new Date());
    setPriority('medium');
    onDismiss();
  };

  return (
    <Portal>
      {visible && (
        <BlurView
          intensity={20}
          style={StyleSheet.absoluteFill}
          tint="dark"
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            onPress={onDismiss}
          />
        </BlurView>
      )}
      
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Surface style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="playlist-plus" size={24} color="#fff" />
              </View>
              <Text style={styles.title}>Create New Task</Text>
            </View>
            <IconButton 
              icon="minus" 
              onPress={onDismiss}
              style={styles.closeButton}
            />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.form}
          >
            <TextInput
              label="What needs to be done?"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              outlineColor="#e0e0e0"
              activeOutlineColor="#6200ee"
              left={<TextInput.Icon icon="format-title" color="#6200ee" />}
            />

            <TextInput
              label="Add details"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={[styles.input, styles.descriptionInput]}
              outlineColor="#e0e0e0"
              activeOutlineColor="#6200ee"
              left={<TextInput.Icon icon="text" color="#6200ee" />}
            />

            <View style={styles.dateSection}>
              <Text style={styles.sectionTitle}>Due Date</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={24} color="#6200ee" />
                <Text style={styles.dateText}>{dueDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.prioritySection}>
              <Text style={styles.sectionTitle}>Priority Level</Text>
              <View style={styles.priorityButtons}>
                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    priority === 'low' && styles.lowPriorityActive
                  ]}
                  onPress={() => setPriority('low')}
                >
                  <MaterialCommunityIcons 
                    name="flag-outline" 
                    size={20} 
                    color={priority === 'low' ? '#fff' : '#4CAF50'} 
                  />
                  <Text style={[
                    styles.priorityText,
                    priority === 'low' && styles.activePriorityText
                  ]}>Low</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    priority === 'medium' && styles.mediumPriorityActive
                  ]}
                  onPress={() => setPriority('medium')}
                >
                  <MaterialCommunityIcons 
                    name="flag-outline" 
                    size={20} 
                    color={priority === 'medium' ? '#fff' : '#FFC107'} 
                  />
                  <Text style={[
                    styles.priorityText,
                    priority === 'medium' && styles.activePriorityText
                  ]}>Medium</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    priority === 'high' && styles.highPriorityActive
                  ]}
                  onPress={() => setPriority('high')}
                >
                  <MaterialCommunityIcons 
                    name="flag-outline" 
                    size={20} 
                    color={priority === 'high' ? '#fff' : '#F44336'} 
                  />
                  <Text style={[
                    styles.priorityText,
                    priority === 'high' && styles.activePriorityText
                  ]}>High</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, !title.trim() && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!title.trim()}
            >
              <MaterialCommunityIcons name="check" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Create Task</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDueDate(selectedDate);
                }
              }}
            />
          )}
        </Surface>
      </Animated.View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#6200ee',
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  closeButton: {
    backgroundColor: '#f5f5f5',
    margin: 0,
  },
  form: {
    padding: 20,
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  descriptionInput: {
    minHeight: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 12,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2c2c2c',
  },
  prioritySection: {
    marginBottom: 24,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    gap: 8,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lowPriorityActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  mediumPriorityActive: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
  },
  highPriorityActive: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  activePriorityText: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 