import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

interface CircularTimerProps {
  duration: number;
  timeLeft: number;
  isBreak?: boolean;
}

export const CircularTimer = ({ duration, timeLeft, isBreak = false }: CircularTimerProps) => {
  const animatedValue = new Animated.Value(0);
  const radius = 120;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * radius;
  const color = isBreak 
    ? ['#4CAF50', '#81C784'] as const 
    : ['#6200ee', '#9c27b0'] as const;

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress
  const progress = timeLeft / duration;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [timeLeft]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={color}
        style={[styles.background, { borderRadius: radius + strokeWidth }]}
      >
        <View style={styles.timerContainer}>
          <Animated.View
            style={[
              styles.progressCircle,
              {
                width: radius * 2,
                height: radius * 2,
                borderRadius: radius,
                borderWidth: strokeWidth,
                transform: [{
                  rotate: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['360deg', '0deg'],
                  })
                }]
              }
            ]}
          />
          <View style={styles.timeTextContainer}>
            <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
            <Text style={styles.labelText}>
              {isBreak ? 'Break Time' : 'Focus Time'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
  },
  background: {
    padding: 20,
    elevation: 5,
  },
  timerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    borderColor: '#fff',
    opacity: 0.8,
  },
  timeTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  labelText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginTop: 8,
  },
}); 