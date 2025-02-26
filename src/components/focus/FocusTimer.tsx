import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, BackHandler, Animated, Easing } from 'react-native';
import { Text, Button, Surface, Portal, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusStore } from '../../stores/focusStore';
import { useCoinsStore } from '../../stores/coinsStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface FocusTimerProps {
  onComplete: () => void;
}

export default function FocusTimer({ onComplete }: FocusTimerProps) {
  const router = useRouter();
  const { currentSession, endSession, timeLeft, isActive, pauseSession, resumeSession } = useFocusStore();
  const { addCoins } = useCoinsStore();
  const { toggleComplete } = useTasksStore();
  
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [hasAwarded, setHasAwarded] = useState(false);

  // Animation values
  const progressAnimation = new Animated.Value(0);
  const scaleAnimation = new Animated.Value(1);
  const pulseAnimation = new Animated.Value(1);
  const focusTextAnimation = new Animated.Value(0);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (currentSession) {
      Animated.timing(progressAnimation, {
        toValue: 1 - (timeLeft / currentSession.duration),
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start();
    }
  }, [timeLeft, currentSession]);

  useEffect(() => {
    // Start pulse animation for the progress circle
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Fade in focus text
    Animated.timing(focusTextAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSessionComplete = useCallback(async () => {
    if (!hasAwarded && currentSession) {
      try {
        setHasAwarded(true);
        
        // Calculate coins
        const minutesCompleted = Math.floor(currentSession.duration / 60);
        const coins = Math.max(1, minutesCompleted);
        setEarnedCoins(coins);
        
        // Add coins first
        await addCoins(coins);
        
        // Complete task
        if (currentSession.task_id) {
          await toggleComplete(currentSession.task_id);
        }
        
        setShowReward(true);
      } catch (error) {
        console.error('Error completing session:', error);
        router.replace('/focus');
      }
    }
  }, [currentSession, hasAwarded, addCoins, toggleComplete, router]);

  const handleQuit = async () => {
    setShowConfirmQuit(false);
    try {
      await endSession(false);
      onComplete();
      router.replace('/focus');
    } catch (error) {
      console.error('Error quitting session:', error);
      router.replace('/focus');
    }
  };

  const handleRewardCollect = async () => {
    try {
      await endSession(true);
      setShowReward(false);
      onComplete();
      router.replace('/focus');
    } catch (error) {
      console.error('Error collecting reward:', error);
      router.replace('/focus');
    }
  };

  // Handle timer completion
  useEffect(() => {
    if (timeLeft === 0 && isActive && !hasAwarded) {
      handleSessionComplete();
    }
  }, [timeLeft, isActive, hasAwarded, handleSessionComplete]);

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      setShowConfirmQuit(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const progressRotate = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6200ee', '#9c27b0']} style={styles.gradient}>
        <Surface style={styles.timerCard}>
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressCircle,
                {
                  transform: [
                    { rotate: progressRotate },
                    { scale: scaleAnimation }
                  ],
                },
              ]}
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeDisplay}>{formatTime(timeLeft)}</Text>
              <Animated.Text 
                style={[
                  styles.taskName,
                  { opacity: focusTextAnimation }
                ]}
              >
                {currentSession?.task_id ? 'Focusing...' : 'Ready'}
              </Animated.Text>
            </View>
          </View>

          <View style={styles.controls}>
            <Button
              mode="contained"
              onPress={() => isActive ? pauseSession() : resumeSession()}
              style={[styles.controlButton, isActive ? styles.pauseButton : styles.playButton]}
            >
              {isActive ? 'Pause' : 'Resume'}
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => setShowConfirmQuit(true)}
              style={styles.controlButton}
            >
              Quit
            </Button>
          </View>
        </Surface>

        <Portal>
          <Dialog visible={showConfirmQuit} onDismiss={() => setShowConfirmQuit(false)}>
            <Dialog.Title>End Session?</Dialog.Title>
            <Dialog.Content>
              <Text>Are you sure you want to end this focus session?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowConfirmQuit(false)}>Continue</Button>
              <Button onPress={handleQuit} textColor="#FF5252">End Session</Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={showReward} onDismiss={handleRewardCollect}>
            <Dialog.Title>Great Job!</Dialog.Title>
            <Dialog.Content>
              <View style={styles.rewardContent}>
                <MaterialCommunityIcons name="star-circle" size={64} color="#FFD700" />
                <Text style={styles.rewardText}>Focus session complete!</Text>
                <View style={styles.coinsContainer}>
                  <MaterialCommunityIcons name="star-circle" size={32} color="#FFD700" />
                  <Text style={styles.coinsText}>+{earnedCoins}</Text>
                  <Text style={styles.coinsLabel}>coins earned</Text>
                </View>
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button mode="contained" onPress={handleRewardCollect}>
                Collect Reward
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  timerCard: {
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    elevation: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  progressContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  progressCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 150,
    borderWidth: 12,
    borderColor: '#6200ee',
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timeContainer: {
    alignItems: 'center',
  },
  timeDisplay: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#6200ee',
    textShadowColor: 'rgba(98, 0, 238, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  taskName: {
    fontSize: 20,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    minWidth: 130,
    borderRadius: 16,
    elevation: 4,
    paddingVertical: 8,
  },
  pauseButton: {
    backgroundColor: '#FF5252',
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  rewardContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  rewardText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    padding: 20,
    borderRadius: 20,
  },
  coinsText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  coinsLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
}); 