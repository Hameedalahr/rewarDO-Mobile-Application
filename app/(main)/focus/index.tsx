import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, Animated, TouchableOpacity } from 'react-native';
import { Card, Text, Button, List, Portal, Dialog, TextInput, Surface, Divider, IconButton } from 'react-native-paper';
import { useTasksStore } from '../../../src/stores/tasksStore';
import { useFocusStore } from '../../../src/stores/focusStore';
import FocusTimer from '../../../src/components/focus/FocusTimer';

import GradientHeader from '../../../src/components/common/GradientHeader';
import { useAIStore } from '../../../src/stores/aiStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';

interface DurationSelectorProps {
  duration: string;
  setDuration: (duration: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const DurationSelector = ({ duration, setDuration, onConfirm, onCancel }: DurationSelectorProps) => {
  const [isManualInput, setIsManualInput] = useState(false);
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('25');
  const [sliderValue, setSliderValue] = useState(parseInt(duration));

  const handleManualTimeChange = () => {
    const totalMinutes = (parseInt(hours || '0') * 60) + parseInt(minutes || '0');
    if (totalMinutes > 0 && totalMinutes <= 120) {
      setDuration(totalMinutes.toString());
      setSliderValue(totalMinutes);
      setIsManualInput(false);
    } else {
      alert('Please enter a valid duration (1-120 minutes)');
    }
  };

  const handleSliderChange = (value: number) => {
    const roundedValue = Math.round(value);
    setSliderValue(roundedValue);
    setDuration(roundedValue.toString());
  };

  return (
    <Dialog.Content>
      <Text style={styles.dialogSubtitle}>
        {isManualInput ? 'Enter Duration' : 'Select Duration'}
      </Text>

      {isManualInput ? (
        <View style={styles.manualInputContainer}>
          <View style={styles.timeInputRow}>
            <View style={styles.timeInputGroup}>
              <TextInput
                label="Hours"
                value={hours}
                onChangeText={text => {
                  const cleanText = text.replace(/[^0-9]/g, '');
                  setHours(cleanText);
                }}
                keyboardType="numeric"
                mode="outlined"
                style={styles.timeInput}
                maxLength={1}
              />
              <Text style={styles.timeLabel}>hours</Text>
            </View>
            <View style={styles.timeInputGroup}>
              <TextInput
                label="Minutes"
                value={minutes}
                onChangeText={text => {
                  const cleanText = text.replace(/[^0-9]/g, '');
                  const numValue = parseInt(cleanText || '0');
                  if (numValue <= 59) {
                    setMinutes(cleanText);
                  }
                }}
                keyboardType="numeric"
                mode="outlined"
                style={styles.timeInput}
                maxLength={2}
              />
              <Text style={styles.timeLabel}>minutes</Text>
            </View>
          </View>
          <View style={styles.manualButtonsContainer}>
            <Button 
              mode="outlined" 
              onPress={() => setIsManualInput(false)}
              style={styles.manualButton}
            >
              Use Presets
            </Button>
            <Button 
              mode="contained" 
              onPress={handleManualTimeChange}
              style={styles.manualButton}
            >
              Set Time
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.durationContainer}>
          <Text style={styles.durationDisplay}>
            {parseInt(duration) >= 60 
              ? `${Math.floor(parseInt(duration) / 60)}h ${parseInt(duration) % 60}m`
              : `${duration} minutes`
            }
          </Text>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>1m</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={120}
              value={sliderValue}
              onValueChange={handleSliderChange}
              minimumTrackTintColor="#6200ee"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#6200ee"
              step={1}
            />
            <Text style={styles.sliderLabel}>2h</Text>
          </View>

          <View style={styles.presetGrid}>
            {[1, 15, 25, 30, 45, 60].map(preset => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  duration === preset.toString() && styles.presetButtonActive
                ]}
                onPress={() => {
                  setDuration(preset.toString());
                  setSliderValue(preset);
                }}
              >
                <Text style={[
                  styles.presetButtonText,
                  duration === preset.toString() && styles.presetButtonTextActive
                ]}>
                  {preset >= 60 ? `${Math.floor(preset / 60)}h ${preset % 60}m` : `${preset}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button 
            mode="outlined"
            onPress={() => {
              setHours('0');
              setMinutes('1');
              setIsManualInput(true);
            }}
            icon="pencil"
            style={styles.customButton}
          >
            Custom Duration
          </Button>
        </View>
      )}

      <Dialog.Actions>
        <Button onPress={onCancel}>Cancel</Button>
        <Button mode="contained" onPress={onConfirm}>Start Focus</Button>
      </Dialog.Actions>
    </Dialog.Content>
  );
};

export default function FocusScreen() {
  const { tasks } = useTasksStore();
  const { currentSession, startSession, sessions } = useFocusStore();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showDurationDialog, setShowDurationDialog] = useState(false);
  const [duration, setDuration] = useState('25');
  
  // Make AI store optional with try-catch
  let aiStore;
  try {
    aiStore = useAIStore();
  } catch (error) {
    console.warn('AI features are not available:', error);
    aiStore = { insights: null, analyzeFocusTime: () => {} };
  }
  const { insights, analyzeFocusTime } = aiStore;

  const incompleteTasks = tasks.filter(t => !t.completed);

  const stats = [
    {
      value: sessions.length,
      label: 'Sessions',
    },
    {
      value: Math.round(sessions.reduce((acc, s) => acc + (s.duration / 60), 0)),
      label: 'Minutes',
    },
    {
      value: incompleteTasks.length,
      label: 'Tasks',
    },
  ];

  const [scaleAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  const [selectedTaskAnim] = useState(new Animated.Value(0));

  const router = useRouter();

  const handleTaskPress = (taskId: string) => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 20,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
      })
    ]).start();

    setSelectedTask(taskId);
    setShowDurationDialog(true);
  };

  const handleDurationChange = (value: string) => {
    // Convert string input to number and ensure it's within valid range (1-120 minutes)
    const duration = Math.min(Math.max(parseInt(value) || 0, 1), 120);
    setDuration(duration.toString());
  };

  const handleStartFocus = async () => {
    if (!selectedTask) {
      alert('Please select a task first');
      return;
    }

    const durationInMinutes = parseInt(duration);
    if (isNaN(durationInMinutes) || durationInMinutes <= 0 || durationInMinutes > 120) {
      alert('Please enter a valid duration between 1 and 120 minutes');
      return;
    }

    try {
      await startSession(selectedTask, durationInMinutes);
      setShowDurationDialog(false);
    } catch (error) {
      console.error('Failed to create focus session:', error);
      alert('Failed to start focus session');
    }
  };

  const handleComplete = () => {
    setSelectedTask(null);
  };

  useEffect(() => {
    // Only call analyzeFocusTime if it's available
    if (analyzeFocusTime) {
      try {
        analyzeFocusTime();
      } catch (error) {
        console.warn('Failed to analyze focus time:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (showDurationDialog) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [showDurationDialog]);

  // Handle status bar visibility based on focus mode
  useEffect(() => {
    if (currentSession) {
      // Hide status bar during focus mode
      StatusBar.setHidden(true);
    } else {
      // Show status bar when not in focus mode
      StatusBar.setHidden(false);
    }

    // Cleanup when component unmounts
    return () => {
      StatusBar.setHidden(false);
    };
  }, [currentSession]);

  // Sort sessions by date (most recent first)
  const sortedSessions = [...sessions]
    .filter(session => session.completed)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

  const calculateCoins = (duration: number) => {
    // Assuming 1 coin per minute of focus
    return Math.floor(duration / 60);
  };

  if (currentSession) {
    return <FocusTimer onComplete={handleComplete} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <LinearGradient
          colors={['#6200ee', '#9c27b0']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Focus Mode</Text>
              <TouchableOpacity 
                style={styles.historyButton}
                onPress={() => router.push('/focus/history')}
              >
                <MaterialCommunityIcons name="history" size={24} color="#fff" />
                <Text style={styles.historyText}>Focus History</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.headerSubtitle}>Select a task to focus on</Text>
          </View>

          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <Surface key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </Surface>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {incompleteTasks.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons name="playlist-check" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No tasks available</Text>
                <Text style={styles.emptySubtext}>Add some tasks to get started</Text>
              </Card.Content>
            </Card>
          ) : (
            incompleteTasks.map((task) => (
              <Animated.View
                key={task.id}
                style={[
                  styles.taskContainer,
                  {
                    transform: [
                      { scale: selectedTask === task.id ? scaleAnim : 1 }
                    ]
                  }
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleTaskPress(task.id)}
                  activeOpacity={0.7}
                >
                  <Surface style={styles.taskCard}>
                    <View style={styles.taskHeader}>
                      <MaterialCommunityIcons 
                        name="checkbox-blank-circle-outline" 
                        size={24} 
                        color="#6200ee" 
                      />
                      <Text style={styles.taskTitle}>{task.title}</Text>
                    </View>
                    {task.description && (
                      <Text style={styles.taskDescription}>{task.description}</Text>
                    )}
                  </Surface>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>

      <Portal>
        <Dialog 
          visible={showDurationDialog} 
          onDismiss={() => setShowDurationDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Set Focus Duration</Dialog.Title>
          <DurationSelector
            duration={duration}
            setDuration={setDuration}
            onConfirm={handleStartFocus}
            onCancel={() => setShowDurationDialog(false)}
          />
        </Dialog>
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
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    padding: 16,
    justifyContent: 'space-around',
  },
  statCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    elevation: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
  },
  content: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#f5f5f5',
    padding: 16,
    minHeight: 600,
  },
  taskContainer: {
    marginBottom: 12,
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    color: '#202020',
  },
  taskDescription: {
    marginTop: 8,
    marginLeft: 36,
    color: '#666',
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
  dialog: {
    borderRadius: 16,
  },
  dialogContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  dialogTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  durationContainer: {
    padding: 16,
    alignItems: 'center',
  },
  durationDisplay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 24,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  presetButton: {
    width: '30%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6200ee',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  presetButtonActive: {
    backgroundColor: '#6200ee',
  },
  presetButtonText: {
    color: '#6200ee',
    fontWeight: '600',
  },
  presetButtonTextActive: {
    color: '#fff',
  },
  customButton: {
    marginTop: 8,
  },
  manualInputContainer: {
    padding: 16,
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeInputGroup: {
    flex: 1,
    marginHorizontal: 8,
  },
  timeInput: {
    backgroundColor: '#fff',
  },
  timeLabel: {
    textAlign: 'center',
    marginTop: 4,
    color: '#666',
  },
  manualButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  manualButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  dialogSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  historyText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 24,
    width: '100%',
  },
  slider: {
    flex: 1,
    marginHorizontal: 12,
    height: 40,
  },
  sliderLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
});