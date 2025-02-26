import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar, IconButton } from 'react-native-paper';
import { Achievement } from '../../types/achievements';

interface Props {
  achievement: Achievement;
}

export default function AchievementCard({ achievement }: Props) {
  const progress = achievement.progress / achievement.requirement;

  return (
    <Card style={[styles.card, achievement.unlocked && styles.unlockedCard]}>
      <Card.Content style={styles.content}>
        <IconButton
          icon={achievement.icon}
          size={32}
          iconColor={achievement.unlocked ? '#4caf50' : '#9e9e9e'}
        />
        <View style={styles.details}>
          <Text variant="titleMedium">{achievement.title}</Text>
          <Text variant="bodySmall" style={styles.description}>
            {achievement.description}
          </Text>
          <ProgressBar
            progress={progress}
            style={styles.progress}
            color={achievement.unlocked ? '#4caf50' : '#6200ee'}
          />
          <Text variant="bodySmall" style={styles.progressText}>
            {Math.floor(achievement.progress)} / {achievement.requirement}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  unlockedCard: {
    backgroundColor: '#f1f8e9',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 8,
  },
  description: {
    color: '#666',
    marginTop: 2,
    marginBottom: 8,
  },
  progress: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    textAlign: 'right',
    marginTop: 4,
    color: '#666',
  },
}); 