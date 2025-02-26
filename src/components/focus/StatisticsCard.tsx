import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar } from 'react-native-paper';
import { useStatisticsStore } from '../../stores/statisticsStore';

export default function StatisticsCard() {
  const { dailyStats } = useStatisticsStore();

  const today = dailyStats[0] || {
    total_focus_time: 0,
    completed_sessions: 0,
    total_sessions: 0,
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const completionRate = today.total_sessions > 0
    ? (today.completed_sessions / today.total_sessions)
    : 0;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>Today's Progress</Text>
        
        <View style={styles.stat}>
          <Text>Focus Time</Text>
          <Text variant="titleMedium">{formatTime(today.total_focus_time)}</Text>
        </View>

        <View style={styles.stat}>
          <Text>Completed Sessions</Text>
          <Text variant="titleMedium">
            {today.completed_sessions}/{today.total_sessions}
          </Text>
        </View>

        <Text style={styles.label}>Completion Rate</Text>
        <ProgressBar
          progress={completionRate}
          style={styles.progress}
          color="#4caf50"
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
  },
  progress: {
    height: 8,
  },
}); 