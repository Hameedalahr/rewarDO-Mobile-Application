import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Surface, Text, IconButton } from 'react-native-paper';

interface Props {
  title: string;
  icon: string;
  onDismiss: () => void;
}

export default function AchievementNotification({ title, icon, onDismiss }: Props) {
  const translateY = new Animated.Value(-100);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <Surface style={styles.surface}>
        <IconButton icon="trophy" size={24} iconColor="#FFD700" />
        <View style={styles.content}>
          <Text variant="titleMedium">Achievement Unlocked!</Text>
          <Text variant="bodyMedium">{title}</Text>
        </View>
        <IconButton icon={icon} size={24} iconColor="#4CAF50" />
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: 16,
  },
  surface: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 4,
  },
  content: {
    flex: 1,
    marginHorizontal: 8,
  },
}); 