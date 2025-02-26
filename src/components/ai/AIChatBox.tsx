import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Text, IconButton, Surface, Portal, Button, ActivityIndicator, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTasksStore } from '../../stores/tasksStore';
import { useAIStore } from '../../stores/aiStore';
import { BlurView } from 'expo-blur';
import OptimizedTextInput from '../common/OptimizedTextInput';

const { height } = Dimensions.get('window');
const CHAT_HEIGHT = height * 0.7;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  text: "Hi! I'm your AI assistant. I can help you manage tasks, improve focus, and boost productivity. What would you like help with?",
  sender: 'ai',
  timestamp: new Date(),
  status: 'sent'
};

export default function AIChatBox({ visible, onDismiss }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [showTaskConfirmation, setShowTaskConfirmation] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { addTask } = useTasksStore();
  const { generateResponse, extractTasks, isAvailable } = useAIStore();
  const slideAnim = useRef(new Animated.Value(CHAT_HEIGHT)).current;

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
        toValue: CHAT_HEIGHT,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  const handleAddTasks = async () => {
    try {
      const taskPromises = extractedTasks.map(task => 
        addTask({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          due_date: task.due_date,
          completed: false
        })
      );

      await Promise.all(taskPromises);
      setShowTaskConfirmation(false);
      
      // Add confirmation message to chat
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `✅ Added ${extractedTasks.length} task${extractedTasks.length > 1 ? 's' : ''} to your dashboard.`,
        sender: 'ai',
        timestamp: new Date(),
        status: 'sent'
      }]);
    } catch (error) {
      console.error('Error adding tasks:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    const tempAiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: '...',
      sender: 'ai',
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage, tempAiMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Extract tasks first
      const tasks = await extractTasks(input);
      
      // If tasks were found, show confirmation dialog
      if (tasks.length > 0) {
        setExtractedTasks(tasks);
        setShowTaskConfirmation(true);
      }

      // Generate AI response
      const aiResponse = await generateResponse(input, tasks);
      
      // Update the temporary message with the actual response
      setMessages(prev => prev.map(msg => 
        msg.id === tempAiMessage.id
          ? { ...msg, text: aiResponse, status: 'sent' }
          : msg
      ));
    } catch (error) {
      console.warn('Error processing message:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === tempAiMessage.id
          ? {
              ...msg,
              text: 'Sorry, I encountered an error. Please try again.',
              status: 'error'
            }
          : msg
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.message,
        message.sender === 'user' ? styles.userMessage : styles.aiMessage
      ]}
    >
      {message.sender === 'ai' && (
        <MaterialCommunityIcons 
          name="robot" 
          size={20} 
          color="#6200ee" 
          style={styles.messageIcon}
        />
      )}
      <View style={styles.messageContent}>
        <Text 
          style={[
            styles.messageText,
            message.sender === 'user' ? styles.userMessageText : styles.aiMessageText,
            message.status === 'error' && styles.errorText
          ]}
        >
          {message.text}
        </Text>
        {message.status === 'sending' && (
          <ActivityIndicator size={16} color="#6200ee" style={styles.loader} />
        )}
      </View>
    </View>
  );

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
              <MaterialCommunityIcons name="robot" size={24} color="#6200ee" />
              <Text style={styles.title}>AI Assistant</Text>
              {!isAvailable && (
                <View style={styles.offlineBadge}>
                  <Text style={styles.offlineText}>Offline</Text>
                </View>
              )}
            </View>
            <IconButton 
              icon="minus" 
              onPress={onDismiss}
              style={styles.closeButton}
            />
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
          >
            {messages.map(renderMessage)}
          </ScrollView>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.inputContainer}>
              <OptimizedTextInput
                value={input}
                onChangeText={setInput}
                placeholder={isProcessing ? 'Processing...' : 'Ask me anything...'}
                mode="outlined"
                style={styles.input}
                multiline
                maxLength={500}
                disabled={isProcessing}
                right={
                  <OptimizedTextInput.Icon
                    icon={isProcessing ? 'loading' : 'send'}
                    onPress={handleSend}
                    disabled={!input.trim() || isProcessing}
                    color="#6200ee"
                  />
                }
              />
            </View>
          </KeyboardAvoidingView>
        </Surface>
      </Animated.View>

      <Portal>
        <Dialog visible={showTaskConfirmation} onDismiss={() => setShowTaskConfirmation(false)}>
          <Dialog.Title>Add Tasks</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              I found the following tasks in your message:
            </Text>
            {extractedTasks.map((task, index) => (
              <View key={index} style={styles.taskPreview}>
                <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color="#6200ee" />
                <View style={styles.taskDetails}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>
                    Due: {new Date(task.due_date).toLocaleDateString()} • Priority: {task.priority}
                  </Text>
                </View>
              </View>
            ))}
            <Text style={styles.dialogQuestion}>
              Would you like me to add {extractedTasks.length > 1 ? 'these tasks' : 'this task'} to your dashboard?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowTaskConfirmation(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleAddTasks}>
              Add {extractedTasks.length > 1 ? 'Tasks' : 'Task'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CHAT_HEIGHT,
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#6200ee',
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    margin: 0,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  message: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  messageIcon: {
    marginRight: 8,
    marginTop: 4,
  },
  messageContent: {
    flex: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    padding: 12,
    borderRadius: 20,
  },
  userMessageText: {
    backgroundColor: '#6200ee',
    color: '#fff',
    borderTopRightRadius: 4,
  },
  aiMessageText: {
    backgroundColor: '#f0f0f0',
    color: '#2c2c2c',
    borderTopLeftRadius: 4,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    maxHeight: 120,
    fontSize: 16,
    lineHeight: 24,
    paddingTop: 8,
    paddingBottom: 8,
    textAlign: 'left',
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  errorText: {
    color: '#FF5252',
  },
  loader: {
    marginTop: 4,
  },
  offlineBadge: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
  },
  dialogText: {
    marginBottom: 16,
  },
  taskPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  taskDetails: {
    marginLeft: 12,
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  taskMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dialogQuestion: {
    marginTop: 16,
    fontStyle: 'italic',
  },
}); 